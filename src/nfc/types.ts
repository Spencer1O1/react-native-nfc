import type { TagEvent } from "react-native-nfc-manager";

export * from "./ndef/types";
export * from "./v/types";

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
