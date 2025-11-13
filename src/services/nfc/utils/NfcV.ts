import { Platform } from "react-native";
import { NfcTech } from "react-native-nfc-manager";

export const NfcV = {
  tech: Platform.OS === "ios" ? [NfcTech.Iso15693IOS] : [NfcTech.NfcV],

  Flags: {
    HIGH_DATA_RATE: 0x02,
    ADDRESSED: 0x20,
    // If needed later: OPTION: 0x40 (not commonly used)
  },

  Commands: {
    READ_SINGLE_BLOCK: 0x20,
    WRITE_SINGLE_BLOCK: 0x21,
    GET_SYSTEM_INFO: 0x2b,
  },

  /**
   * Combine multiple flag bits into one byte.
   * Example: Flags.ADDRESSED | Flags.HIGH_DATA_RATE
   */
  flags(...bits: number[]): number {
    return bits.reduce((acc, bit) => acc | bit, 0);
  },

  /**
   * Convert tag.id hex string (MSB->LSB) into reversed byte array (LSB->MSB)
   * ISO15693 requires reversed UID for addressed commands.
   */
  reverseUid(tagIdHex: string): number[] {
    const bytes = [];
    for (let i = 0; i < tagIdHex.length; i += 2) {
      bytes.unshift(parseInt(tagIdHex.substring(i, i + 2), 16));
    }
    return bytes;
  },

  /**
   * Build READ_SINGLE_BLOCK command.
   * FLAGS: addressed + high data rate by default.
   */
  buildReadBlock(uidReversed: number[], blockNumber: number): number[] {
    const flags = this.flags(this.Flags.ADDRESSED, this.Flags.HIGH_DATA_RATE);
    return [
      flags,
      this.Commands.READ_SINGLE_BLOCK,
      ...uidReversed,
      blockNumber,
    ];
  },

  /**
   * Build WRITE_SINGLE_BLOCK command.
   * Note: data must match the block size (usually 4 or 8 bytes).
   */
  buildWriteBlock(
    uidReversed: number[],
    blockNumber: number,
    data: Uint8Array
  ): number[] {
    const flags = this.flags(this.Flags.ADDRESSED, this.Flags.HIGH_DATA_RATE);
    return [
      flags,
      this.Commands.WRITE_SINGLE_BLOCK,
      ...uidReversed,
      blockNumber,
      ...data,
    ];
  },

  /**
   * Build GET_SYSTEM_INFO command.
   */
  buildGetSystemInfo(uidReversed: number[]): number[] {
    const flags = this.flags(this.Flags.ADDRESSED, this.Flags.HIGH_DATA_RATE);
    return [flags, this.Commands.GET_SYSTEM_INFO, ...uidReversed];
  },

  /**
   * Parse a READ_SINGLE_BLOCK response.
   * Response format:
   *  - byte[0] = status (0x00 = success)
   *  - byte[1..] = block payload bytes
   */
  parseReadResponse(resp: number[]): Uint8Array {
    if (!resp || resp.length === 0) {
      throw new Error("Empty NFC-V response");
    }
    if (resp[0] !== 0x00) {
      throw new Error(`Read failed. Status: 0x${resp[0].toString(16)}`);
    }
    return new Uint8Array(resp.slice(1));
  },

  /**
   * Parse WRITE_SINGLE_BLOCK response.
   * Successful write has resp[0] === 0x00.
   */
  parseWriteResponse(resp: number[]): void {
    if (!resp || resp.length === 0) {
      throw new Error("Empty NFC-V response");
    }
    if (resp[0] !== 0x00) {
      throw new Error(`Write failed. Status: 0x${resp[0].toString(16)}`);
    }
  },

  /**
   * Parse GET_SYSTEM_INFO response.
   * Returns: UID, DSFID, AFI, numberOfBlocks, blockSize, manufacturer
   */
  parseSystemInfo(resp: number[]) {
    if (!resp || resp.length < 2 || resp[0] !== 0x00) {
      throw new Error("Invalid System Info response");
    }

    const infoFlags = resp[1] & 0x0f;
    let offset = 2;

    const result: any = {};

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
      result.numberOfBlocks = resp[offset++] + 1;
      result.blockSize = resp[offset++] + 1;
    }

    // IC Reference
    if (infoFlags & 0x08 && resp.length > offset) {
      result.icReference = resp[offset++];
    }

    if (!result.blockSize) result.blockSize = 4; // default for EM Micro

    result.manufacturer = this.detectManufacturer(result.uid ?? "");

    return result;
  },

  /** Identify common manufacturers based on UID prefix */
  detectManufacturer(uid: string): string {
    if (uid.startsWith("E004") || uid.startsWith("E006"))
      return "EM Microelectronic";
    if (uid.startsWith("E002")) return "STMicroelectronics";
    if (uid.startsWith("E007")) return "Texas Instruments";
    if (uid.startsWith("E010")) return "NXP";
    return "Unknown";
  },
} as const;
