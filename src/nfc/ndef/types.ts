import type { NdefRecord, TNF } from "react-native-nfc-manager";

import type { Builder } from "./builder";

export type NdefBuilder = (r: typeof Builder) => NdefRecord[];

export interface BuildRecordInit {
  tnf: TNF;
  type: string | number[]; // string for auto-encoding, number[] for raw binary
  id?: string | number[];
  payload?: string | number[];
}

export interface NdefMessageResult {
  ndefMessage: NdefRecord[];
  type: number;
  maxSize: number;
  isWritable: boolean;
  canMakeReadOnly: boolean;
}
