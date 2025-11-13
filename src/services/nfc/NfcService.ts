// NfcService.ts
import { Platform } from "react-native";
import NfcManager, {
  Ndef,
  NdefRecord,
  NfcEvents,
  NfcTech,
  TagEvent,
} from "react-native-nfc-manager";
import { NfcV } from "./utils/NfcV";

export type NfcMode =
  | "idle"
  | "starting"
  | "active"
  | "stopping"
  | "technology";

export interface NfcState {
  mode: NfcMode;
  tag: TagEvent | null;
}

export type NfcListener = (state: NfcState) => void;

class NfcService {
  private state: NfcState = { mode: "idle", tag: null };

  private listeners = new Set<NfcListener>();

  constructor() {
    NfcManager.start();
  }

  // --- internal state mgmt ---
  private setState(partial: Partial<NfcState>) {
    this.state = { ...this.state, ...partial };

    for (const listener of this.listeners) listener(this.state);
  }

  getState() {
    return this.state;
  }

  subscribe(fn: NfcListener) {
    this.listeners.add(fn);
    fn(this.state); // emit current state immediately
    return () => {
      this.listeners.delete(fn);
    };
  }

  // --- Reader lifecycle ---
  async startReader(readerModeFlags: number, onTag?: (tag: TagEvent) => void) {
    if (this.state.mode !== "idle") {
      console.warn(`[NFC] Cannot start reader while ${this.state.mode}`);
      return;
    }

    this.setState({ mode: "starting" });

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      this.setState({ tag: tag });
      onTag?.(tag);
    });

    try {
      await NfcManager.registerTagEvent({
        isReaderModeEnabled: true,
        readerModeFlags,
      });
      if ((this.state.mode as NfcMode) === "starting") {
        this.setState({ mode: "active" });
      }
    } catch (err) {
      console.warn("[NFC] startReader error:", err);
      this.setState({ mode: "idle" });
    }
  }

  async stopReader() {
    if (["idle", "stopping"].includes(this.state.mode)) return;
    this.setState({ mode: "stopping" });
    try {
      await NfcManager.unregisterTagEvent();
    } catch {}
    this.setState({ mode: "idle" });
  }

  async withTechnology<T>(
    tech: NfcTech | NfcTech[],
    handler: () => Promise<T>
  ): Promise<T> {
    if (this.state.mode === "technology") {
      throw new Error(`[NFC] Technology is already in use!`);
    }
    if (
      this.state.mode === "starting" ||
      this.state.mode === "active" ||
      this.state.mode === "stopping"
    ) {
      await this.stopReader();
    }

    if (this.state.mode !== "idle") {
      throw new Error(
        `[NFC] Cannot start technology session in mode ${this.state.mode}`
      );
    }

    this.setState({ mode: "technology" });

    try {
      await NfcManager.requestTechnology(tech, {
        alertMessage: "Hold near NFC tag", // iOS
      });

      const result = await handler();

      if (Platform.OS === "ios")
        await NfcManager.setAlertMessageIOS("Success!");

      return result;
    } catch (err: any) {
      const message =
        typeof err === "string" ? err : err?.message || "Unknown NFC error";
      throw new Error(`[NFC] withTechnology error: ${message}`);
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch (cancelErr) {
        console.warn("[NFC] cancelTechnologyRequest failed:", cancelErr);
      }
      this.setState({ mode: "idle" });
    }
  }

  // --- Writer ---
  async writeNdef(records: NdefRecord[]) {
    // Use NFC-A/Type 2 as fallback (often required on Android)
    await this.withTechnology([NfcTech.Ndef, NfcTech.NfcA], async () => {
      const bytes = Ndef.encodeMessage(records);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
    });
  }

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
  // | 4–7 | —    | RFU (reserved)

  async writeNfcV(blockNumber: number, data: Uint8Array) {
    // TODO: Handle transcieve
    return await this.withTechnology(NfcV.tech, async () => {
      // const cmd = [0x02, 0x21, ...data]; // example command format
      // await NfcManager.transceive(cmd);

      // --- Get the current tag UID ---
      const tag = await NfcManager.getTag();
      if (!tag?.id) throw new Error("No NFC-V tag detected");

      // UID comes as a hex string like "2FF1EF21017816E0"
      // ISO15693 expects *reverse-byte-order*
      const uidBytes = [];
      for (let i = 0; i < tag.id.length; i += 2) {
        const byteHex = tag.id.slice(i, i + 2);
        uidBytes.unshift(parseInt(byteHex, 16));
      }

      // Flags: 0x22 = addressed, high data rate
      // Cmd:   0x21 = Write Single Block
      const cmd = [0x22, 0x21, ...uidBytes, blockNumber, ...data];

      console.log("[NFCV] Writing cmd:", cmd);

      const resp = await NfcManager.transceive(cmd);
      console.log("[NFCV] Write response:", resp);

      // If response’s first byte == 0x00 → success
      if (resp?.[0] !== 0x00) throw new Error(`Write failed: ${resp}`);
    });
  }

  async readBlockNfcV(blockNumber: number) {
    return this.withTechnology(NfcV.tech, async () => {
      const tag = await NfcManager.getTag();
      if (!tag?.id) throw new Error("No tag");

      const uidBytes = [];
      for (let i = 0; i < tag.id.length; i += 2)
        uidBytes.unshift(parseInt(tag.id.substr(i, 2), 16));

      // 0x22 flags, 0x20 command = Read Single Block
      const cmd = [0x22, 0x20, ...uidBytes, blockNumber];
      const resp = await NfcManager.transceive(cmd);

      if (resp?.[0] !== 0x00) throw new Error(`Read failed: ${resp}`);

      // bytes after first are data
      const blockData = resp.slice(1);
      console.log("Block", blockNumber, "data:", blockData);
    });
  }

  async getSystemInfoNfcV() {
    return this.withTechnology(NfcV.tech, async () => {
      const tag = await NfcManager.getTag();
      if (!tag?.id) throw new Error("No NFC-V tag detected");

      const uidBytes = (tag.id.match(/.{1,2}/g) || [])
        .map((b) => parseInt(b, 16))
        .reverse();

      const cmd = [0x22, 0x2b, ...uidBytes];
      const resp = await NfcManager.transceive(cmd);

      if (!resp || resp.length < 2 || resp[0] !== 0x00)
        throw new Error("System Info failed");

      const infoFlags = resp[1] & 0x0f; // mask off non-standard bits
      let offset = 2;

      const result: any = {};

      // UID (8 bytes, always present)
      if (resp.length >= offset + 8) {
        const uid = resp.slice(offset, offset + 8);
        result.uid = Array.from(uid)
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

      // IC reference (optional)
      if (infoFlags & 0x08 && resp.length > offset) {
        result.icReference = resp[offset++];
      }

      // Fallback: infer block size if missing (default 4 bytes for EM Micro)
      if (!result.blockSize) result.blockSize = 4;

      function getManufacturer(uid: string): string {
        if (uid.startsWith("E004") || uid.startsWith("E006"))
          return "EM Microelectronic";
        if (uid.startsWith("E002")) return "STMicroelectronics";
        if (uid.startsWith("E007")) return "Texas Instruments";
        if (uid.startsWith("E010")) return "NXP";
        return "Unknown";
      }
      result.manufacturer = getManufacturer(result.uid || "");

      console.log("[NFCV] System Info (EM-safe):", result);
      return result;
    });
  }
}

// Export one stable instance
export const nfcService = new NfcService();
