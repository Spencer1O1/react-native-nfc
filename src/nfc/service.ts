import { Platform } from "react-native";
import nfcManager, {
  NfcEvents,
  type NfcTech,
  type TagEvent,
} from "react-native-nfc-manager";

import { NfcError } from "./error";
import type { NfcMode, NfcState } from "./types";

export type NfcListener = (state: NfcState) => void;

export class NfcService {
  private state: NfcState = { mode: "idle", tag: null };
  private listeners = new Set<NfcListener>();

  private isProcessingTag = false;
  private currentOnTag?: (tag: TagEvent) => Promise<void> | void;
  private currentCooldownMs = 1500;
  private cooldownTimer?: ReturnType<typeof setTimeout>;

  private readerModeFlags_ANDROID: number | null = null;

  constructor() {
    nfcManager.start();
  }

  enableReaderMode_ANDROID(flags: number) {
    if (Platform.OS !== "android") return;
    this.readerModeFlags_ANDROID = flags;
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
    fn(this.state); // emit immediately
    return () => {
      this.listeners.delete(fn);
    };
  }

  // -----------------------------
  // START READER (Soft Continuous Mode)
  // -----------------------------
  async startReader(
    onTag?: (tag: TagEvent) => Promise<void> | void,
    options?: { cooldownMs?: number },
  ) {
    if (this.state.mode !== "idle") {
      console.warn(`[NFC] Cannot start reader while ${this.state.mode}`);
      return;
    }

    this.currentOnTag = onTag;
    this.currentCooldownMs = options?.cooldownMs ?? 1500;
    this.isProcessingTag = false;

    this.setState({ mode: "starting", tag: null });

    // Tag listener
    nfcManager.setEventListener(
      NfcEvents.DiscoverTag,
      async (tag: TagEvent) => {
        if (!tag) return;

        // Prevent reprocessing until tag removed & cooldown completed
        if (this.isProcessingTag) return;

        this.isProcessingTag = true;
        this.setState({ tag, mode: "active" });

        try {
          await this.currentOnTag?.(tag);
        } catch (err) {
          console.warn("[NFC] onTag handler error:", err);
        } finally {
          const cooldown = this.currentCooldownMs;

          // After cooldown, allow a new scan *only after tag is removed*
          if (this.cooldownTimer) {
            clearTimeout(this.cooldownTimer);
          }
          this.cooldownTimer = setTimeout(() => {
            this.isProcessingTag = false;
            this.setState({ tag: null });
            this.cooldownTimer = undefined;
          }, cooldown);
        }
      },
    );

    // Start reader
    try {
      if (this.readerModeFlags_ANDROID) {
        await nfcManager.registerTagEvent({
          isReaderModeEnabled: true,
          readerModeFlags: this.readerModeFlags_ANDROID,
        });
      } else {
        await nfcManager.registerTagEvent();
      }

      if ((this.state.mode as NfcMode) === "starting") {
        this.setState({ mode: "active" });
      }
    } catch (err) {
      console.warn("[NFC] startReader error:", err);
      this._resetReaderState();
    }
  }

  // -----------------------------
  // STOP READER (explicit only)
  // -----------------------------
  async stopReader() {
    if (["idle", "stopping"].includes(this.state.mode)) return;

    this.setState({ mode: "stopping" });
    // Ignore any late tag events while we tear down the reader
    nfcManager.setEventListener(NfcEvents.DiscoverTag, () => {});
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }

    try {
      await nfcManager.unregisterTagEvent();
    } catch (err) {
      console.warn("[NFC] unregisterTagEvent error:", err);
    }

    this._resetReaderState();
  }

  private _resetReaderState() {
    if (this.cooldownTimer) {
      clearTimeout(this.cooldownTimer);
      this.cooldownTimer = undefined;
    }
    this.setState({ mode: "idle", tag: null });
    this.currentOnTag = undefined;
    this.isProcessingTag = false;
  }

  // -----------------------------
  // Technology sessions (NDEF, NfcV, etc.)
  // -----------------------------
  async withTechnology<T>(
    tech: NfcTech | NfcTech[],
    handler: () => Promise<T>,
  ): Promise<T> {
    if (this.state.mode === "technology") {
      throw new NfcError("Technology is already in use!");
    }

    if (this.readerModeFlags_ANDROID) {
      return this.withTechnologyReaderMode_ANDROID(
        tech,
        handler,
        this.readerModeFlags_ANDROID,
      );
    }

    // Stop reader before using tech session
    const readerWasActive = ["starting", "active", "stopping"].includes(
      this.state.mode,
    );
    const savedOnTag = this.currentOnTag;
    const savedCooldown = this.currentCooldownMs;

    if (readerWasActive) {
      await this.stopReader();
    }

    if (this.state.mode !== "idle") {
      throw new NfcError(
        `Cannot start technology session in mode ${this.state.mode}`,
      );
    }

    this.setState({ mode: "technology" });

    try {
      await nfcManager.requestTechnology(tech, {
        alertMessage: "Hold near NFC tag",
      });

      const result = await handler();

      if (Platform.OS === "ios") {
        await nfcManager.setAlertMessageIOS("Success!");
      }

      return result;
    } catch (err: any) {
      const message =
        typeof err === "string" ? err : err?.message || "Unknown NFC error";
      throw new NfcError(`withTechnology error: ${message}`);
    } finally {
      try {
        await nfcManager.cancelTechnologyRequest();
      } catch {}

      this.setState({ mode: "idle", tag: null });

      // If reader was active before tech session, restart it automatically
      if (readerWasActive) {
        try {
          await this.startReader(savedOnTag, { cooldownMs: savedCooldown });
        } catch (err) {
          console.warn(
            "[NFC] Failed to restart reader after tech session",
            err,
          );
        }
      }
    }
  }

  private async withTechnologyReaderMode_ANDROID<T>(
    tech: NfcTech | NfcTech[],
    handler: () => Promise<T>,
    flags: number,
  ): Promise<T> {
    const readerWasActive = ["starting", "active", "stopping"].includes(
      this.state.mode,
    );

    // Keep reader mode active during tech request to avoid dispatch gap
    this.isProcessingTag = true;
    this.setState({ mode: "technology" });

    try {
      await nfcManager.requestTechnology(tech, {
        isReaderModeEnabled: true,
        readerModeFlags: flags,
      });

      return await handler();
    } catch (err: any) {
      const message =
        typeof err === "string" ? err : err?.message || "Unknown NFC error";
      throw new NfcError(`withTechnologyReaderMode_ANDROID error: ${message}`);
    } finally {
      try {
        await nfcManager.cancelTechnologyRequest();
      } catch {}

      this.isProcessingTag = false;
      this.setState({ mode: readerWasActive ? "active" : "idle" });
    }
  }
}

// Export singleton
export const nfcService = new NfcService();
