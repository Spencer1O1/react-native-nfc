// Here's where things get REAL
//
// Only iPhone 7+ supports ISO15693; writing may require
// requestTechnology([NfcTech.Iso15693]) and sometimes doesn’t allow raw
// transceive (depends on firmware)
//
// | Byte          | Meaning                                              |
// | ------------- | ---------------------------------------------------- |
// | `0x02`        | Flags (high data rate)                               |
// | `0x20`        | Flags (addressed)                                    |
// | `0x22`        | Flags (0x02 + 0x20 = 0x22 addressed + high data rate)|
// | `0x20`        | Command code: Read Single Block                      |
// | `0x21`        | Command code: Write Single Block                     |
// | `UID[0..7]`   | Tag UID in reverse order (optional if not addressed) |
// | `blockNumber` | Which memory block to write                          |
// | `data[...]`   | The bytes to write (block size usually 4 or 8 bytes) |
//
// Each command is a byte array
// [ FLAGS, COMMAND_CODE, [UID bytes reversed], PARAMS... ]
//
// Tag response:
// The tag response has this structure:
//
// | Byte | Meaning                                       |
// | ---- | --------------------------------------------- |
// | `0`  | **Status** (0x00 = success)                   |
// | `1`  | **Info Flags**                                |
// | …    | Data fields, conditional based on those flags |
//
// Info Flags bitmask:
// | Bit | Hex  | Meaning                                                       |
// | --- | ---- | ------------------------------------------------------------- |
// | 0   | 0x01 | DSFID present                                                 |
// | 1   | 0x02 | AFI present                                                   |
// | 2   | 0x04 | VICC memory size info present (number of blocks + block size) |
// | 3   | 0x08 | IC reference present                                          |
// | 4–7 | —    | RFU (reserved)                                                |

import type { SystemInfo } from "../types";

export const FLAGS = {
  HIGH_DATA_RATE: 0x02,
  ADDRESSED: 0x20,
  // If needed later: OPTION: 0x40 (not commonly used)
};

export const COMMANDS = {
  READ_SINGLE_BLOCK: 0x20,
  WRITE_SINGLE_BLOCK: 0x21,
  GET_SYSTEM_INFO: 0x2b,
};

/**
 * Combine multiple flag bits into one byte.
 * Example: Flags.ADDRESSED | Flags.HIGH_DATA_RATE
 */
export function buildFlags(...bits: number[]): number {
  return bits.reduce((acc, bit) => acc | bit, 0);
}

/**
 * Convert tag.id hex string (MSB->LSB) into reversed byte array (LSB->MSB)
 * ISO15693 requires reversed UID for addressed commands.
 */
export function reverseUid(tagIdHex: string): number[] {
  const bytes = [];
  for (let i = 0; i < tagIdHex.length; i += 2) {
    bytes.unshift(Number.parseInt(tagIdHex.substring(i, i + 2), 16));
  }
  return bytes;
}

/**
 * Build READ_SINGLE_BLOCK command.
 * FLAGS: addressed + high data rate by default.
 */
export function buildReadBlock(
  uidReversed: number[],
  blockNumber: number,
): number[] {
  const flags = buildFlags(FLAGS.ADDRESSED, FLAGS.HIGH_DATA_RATE);
  return [flags, COMMANDS.READ_SINGLE_BLOCK, ...uidReversed, blockNumber];
}

/**
 * Build WRITE_SINGLE_BLOCK command.
 * Note: data must match the block size (usually 4 or 8 bytes).
 */
export function buildWriteBlock(
  uidReversed: number[],
  blockNumber: number,
  data: Uint8Array,
): number[] {
  const flags = buildFlags(FLAGS.ADDRESSED, FLAGS.HIGH_DATA_RATE);
  return [
    flags,
    COMMANDS.WRITE_SINGLE_BLOCK,
    ...uidReversed,
    blockNumber,
    ...data,
  ];
}

/**
 * Build GET_SYSTEM_INFO command.
 */
export function buildGetSystemInfo(): number[] {
  return [FLAGS.HIGH_DATA_RATE, COMMANDS.GET_SYSTEM_INFO];
}

/**
 * Parse a READ_SINGLE_BLOCK response.
 * Response format:
 *  - byte[0] = status (0x00 = success)
 *  - byte[1..] = block payload bytes
 */
export function parseReadResponse(resp: number[]): Uint8Array {
  if (!resp || resp.length === 0) {
    throw new Error("Empty NFC-V response");
  }
  const status = resp[0];
  if (status === undefined) {
    throw new Error("Invalid NFC-V response: missing status byte");
  }
  if (status !== 0x00) {
    throw new Error(`Read failed. Status: 0x${status.toString(16)}`);
  }
  return new Uint8Array(resp.slice(1));
}

/**
 * Parse WRITE_SINGLE_BLOCK response.
 * Successful write has resp[0] === 0x00.
 */
export function parseWriteResponse(resp: number[]): void {
  if (!resp || resp.length === 0) {
    throw new Error("Empty NFC-V response");
  }
  const status = resp[0];
  if (status === undefined) {
    throw new Error("Invalid NFC-V response: missing status byte");
  }
  if (status !== 0x00) {
    throw new Error(`Write failed. Status: 0x${status.toString(16)}`);
  }
}

/**
 * Parse GET_SYSTEM_INFO response.
 * Returns: UID, DSFID, AFI, numberOfBlocks, blockSize, manufacturer
 */

export function parseSystemInfo(resp: number[]) {
  if (!resp || resp.length < 2) {
    throw new Error("Invalid System Info response");
  }
  const status = resp[0];
  if (status === undefined || status !== 0x00) {
    throw new Error("Invalid System Info response");
  }
  const flagsByte = resp[1];
  if (flagsByte === undefined) {
    throw new Error("Invalid System Info response: missing flags byte");
  }

  const infoFlags = flagsByte & 0x0f;
  let offset = 2;

  const result: SystemInfo = {};

  // UID (always present – next 8 bytes)
  if (resp.length >= offset + 8) {
    const uidBytes = resp.slice(offset, offset + 8);
    result.uid = uidBytes
      .slice()
      .reverse()
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();
    offset += 8;
  }

  // DSFID
  if (infoFlags & 0x01 && resp.length > offset) {
    result.dsfid = resp[offset++];
  }

  // AFI
  if (infoFlags & 0x02 && resp.length > offset) {
    result.afi = resp[offset++];
  }

  // Memory size info
  if (infoFlags & 0x04 && resp.length >= offset + 2) {
    const numBlocks = resp[offset++];
    const blkSize = resp[offset++];
    if (numBlocks !== undefined) {
      result.numberOfBlocks = numBlocks + 1;
    }
    if (blkSize !== undefined) {
      result.blockSize = blkSize + 1;
    }
  }

  // IC Reference
  if (infoFlags & 0x08 && resp.length > offset) {
    result.icReference = resp[offset++];
  }

  if (!result.blockSize) result.blockSize = 4; // default for EM Micro

  result.manufacturer = detectManufacturer(result.uid ?? "");

  return result;
}

/** Identify common manufacturers based on UID prefix */
export function detectManufacturer(uid: string): string {
  if (
    uid.startsWith("E004") ||
    uid.startsWith("E006") ||
    uid.startsWith("E016")
  )
    return "EM Microelectronic";
  if (uid.startsWith("E002")) return "STMicroelectronics";
  if (uid.startsWith("E007")) return "Texas Instruments";
  if (uid.startsWith("E010")) return "NXP";
  return "Unknown";
}
