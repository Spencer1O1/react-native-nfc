import { Platform } from "react-native";
import NfcManager, {
  NfcEvents,
  type NfcTech,
  type TagEvent,
} from "react-native-nfc-manager";

import type { NfcMode, NfcState } from "./types";

export type NfcListener = (state: NfcState) => void;

export class NfcService {
  private state: NfcState = { mode: "idle", tag: null };
  private listeners = new Set<NfcListener>();

  private isProcessingTag = false;
  private currentOnTag?: (tag: TagEvent) => Promise<void> | void;
  private currentCooldownMs = 1500;
  private lastUsedReaderFlags: number | null = null; // needed for iOS restart

  constructor() {
    NfcManager.start();
  }

  // -----------------------------
  // Internal state management
  // -----------------------------
  private setState(partial: Partial<NfcState>) {
    this.state = { ...this.state, ...partial };
    for (const listener of this.listeners) listener(this.state);
  }

  getState() {
    return this.state;
  }

  subscribe(fn: NfcListener) {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn); // ignore boolean
    };
  }

  // -----------------------------
  // START READER
  // -----------------------------
  async startReader(
    readerModeFlags: number,
    onTag?: (tag: TagEvent) => Promise<void> | void,
    options?: { cooldownMs?: number },
  ) {
    if (this.state.mode !== "idle") {
      console.warn(`[NFC] Cannot start reader while ${this.state.mode}`);
      return;
    }

    this.currentOnTag = onTag;
    this.currentCooldownMs = options?.cooldownMs ?? 1500;
    this.lastUsedReaderFlags = readerModeFlags;
    this.isProcessingTag = false;

    this.setState({ mode: "starting", tag: null });

    NfcManager.setEventListener(
      NfcEvents.DiscoverTag,
      async (tag: TagEvent) => {
        if (!tag) return;

        // Soft lock to avoid duplicate processing
        if (this.isProcessingTag) return;

        this.isProcessingTag = true;
        this.setState({ tag, mode: "active" });

        try {
          if (this.currentOnTag) {
            await this.currentOnTag(tag);
          }
        } catch (err) {
          console.warn("[NFC] onTag handler error:", err);
        } finally {
          const cooldown = this.currentCooldownMs;

          setTimeout(async () => {
            this.isProcessingTag = false;
            this.setState({ tag: null, mode: "active" });

            // -----------------------------
            // iOS MUST restart reader
            // -----------------------------
            if (Platform.OS === "ios") {
              await this._restartIosReader();
            }
          }, cooldown);
        }
      },
    );

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
      this._resetReaderState();
    }
  }

  // -----------------------------
  // STOP READER
  // -----------------------------
  async stopReader() {
    if (["idle", "stopping"].includes(this.state.mode)) return;

    this.setState({ mode: "stopping" });

    try {
      await NfcManager.unregisterTagEvent();
    } catch (err) {
      console.warn("[NFC] unregisterTagEvent error:", err);
    }

    this._resetReaderState();
  }

  private _resetReaderState() {
    this.setState({ mode: "idle", tag: null });
    this.currentOnTag = undefined;
    this.isProcessingTag = false;
    // keep lastUsedReaderFlags so iOS restart can keep using them
  }

  // -----------------------------
  // iOS RESTART
  // -----------------------------
  private async _restartIosReader() {
    if (Platform.OS !== "ios") return;
    if (this.lastUsedReaderFlags == null) return;

    try {
      await NfcManager.unregisterTagEvent();
      await NfcManager.registerTagEvent({
        isReaderModeEnabled: true,
        readerModeFlags: this.lastUsedReaderFlags,
      });

      this.setState({ mode: "active" });
    } catch (err) {
      console.warn("[NFC] iOS restart error:", err);
      this._resetReaderState();
    }
  }

  // -----------------------------
  // Technology sessions (NDEF, NfcV, etc.)
  // -----------------------------
  async withTechnology<T>(
    tech: NfcTech | NfcTech[],
    handler: () => Promise<T>,
  ): Promise<T> {
    if (this.state.mode === "technology") {
      throw new Error("[NFC] Technology is already in use!");
    }

    // Reader must be stopped for tech sessions
    if (["starting", "active", "stopping"].includes(this.state.mode)) {
      await this.stopReader();
    }

    if (this.state.mode !== "idle") {
      throw new Error(
        `[NFC] Cannot start technology session in mode ${this.state.mode}`,
      );
    }

    this.setState({ mode: "technology", tag: null });

    try {
      await NfcManager.requestTechnology(tech, {
        alertMessage: "Hold near NFC tag",
      });

      const result = await handler();

      if (Platform.OS === "ios") {
        await NfcManager.setAlertMessageIOS("Success!");
      }

      return result;
    } catch (err: any) {
      const message =
        typeof err === "string" ? err : err?.message || "Unknown NFC error";
      throw new Error(`[NFC] withTechnology error: ${message}`);
    } finally {
      try {
        await NfcManager.cancelTechnologyRequest();
      } catch {}

      this.setState({ mode: "idle", tag: null });
    }
  }
}

// Export one stable instance
export const nfcService = new NfcService();
