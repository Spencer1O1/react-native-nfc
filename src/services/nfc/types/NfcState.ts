import { TagEvent } from "react-native-nfc-manager";
import { NfcMode } from "./NfcMode";

export interface NfcState {
  mode: NfcMode;
  tag: TagEvent | null;
}
