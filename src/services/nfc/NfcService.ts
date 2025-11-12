// NfcService.ts
import { Platform } from "react-native";
import NfcManager, {
  Ndef,
  NdefRecord,
  NfcEvents,
  NfcTech,
  TagEvent,
} from "react-native-nfc-manager";

export type NfcState = "idle" | "starting" | "active" | "stopping" | "writing";

export type NfcListener = (state: NfcState) => void;

class NfcService {
  private state: NfcState = "idle";
  private lastTag: TagEvent | null = null;
  private listeners = new Set<NfcListener>();

  constructor() {
    NfcManager.start();
  }

  // --- internal state mgmt ---
  private setState(next: NfcState) {
    if (this.state !== next) {
      this.state = next;
      for (const listener of this.listeners) listener(next);
    }
  }

  getState() {
    return this.state;
  }

  getLastTag() {
    return this.lastTag;
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
    if (this.state !== "idle") {
      console.warn(`[NFC] Cannot start reader while ${this.state}`);
      return;
    }

    this.setState("starting");

    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag: TagEvent) => {
      this.lastTag = tag;
      onTag?.(tag);
    });

    try {
      await NfcManager.registerTagEvent({
        isReaderModeEnabled: true,
        readerModeFlags,
      });
      if ((this.state as NfcState) === "starting") {
        this.setState("active");
      }
    } catch (err) {
      console.warn("[NFC] startReader error:", err);
      this.setState("idle");
    }
  }

  async stopReader() {
    if (["idle", "stopping"].includes(this.state)) return;
    this.setState("stopping");
    try {
      await NfcManager.unregisterTagEvent();
    } catch {}
    this.setState("idle");
  }

  // --- Writer ---
  async writeNdef(records: NdefRecord[]) {
    if (this.state !== "idle") {
      throw new Error(`Cannot write while reader is ${this.state}`);
    }

    this.setState("writing");

    try {
      await NfcManager.requestTechnology(NfcTech.Ndef, {
        alertMessage: "Hold near NFC tag to write",
      });
      const bytes = Ndef.encodeMessage(records);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
      if (Platform.OS === "ios")
        NfcManager.setAlertMessageIOS("Write successful");

      this.setState("idle");
      return { success: true };
    } catch (err) {
      console.warn("[NFC] writeNdef error:", err);
      this.setState("idle");
      return { success: false, error: err };
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}
    }
  }
}

// Export one stable instance
export const nfcService = new NfcService();
