// NfcService.ts
import { Platform } from "react-native";
import NfcManager, {
  NfcEvents,
  NfcTech,
  TagEvent,
} from "react-native-nfc-manager";
import { NfcMode, NfcState } from "./types";

export type NfcListener = (state: NfcState) => void;

export class NfcService {
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
}

// Export one stable instance
export const nfcService = new NfcService();
