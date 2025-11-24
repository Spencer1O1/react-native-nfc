import type { TagEvent } from "react-native-nfc-manager";

import type { NfcMode } from "./nfc-mode";

export interface NfcState {
  mode: NfcMode;
  tag: TagEvent | null;
}
