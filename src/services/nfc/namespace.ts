import { nfcService } from "./service";

import { operations as aOps, NfcAUtils } from "./a";
import { operations as ndefOps, NdefUtils } from "./ndef";
import { NfcVUtils, operations as vOps } from "./v";
/**
 * NFC root namespace providing access to:
 * - NfcService
 * - ISO15693 NFC-V ops
 * - NFC-A ops
 * - NDEF operations
 */
export const nfc = {
  service: nfcService,

  /** ISO15693 protocol helpers and high-level operations */
  v: {
    ...vOps, // NfcVOperations, nfcV
    utils: NfcVUtils,
  },

  /** NFC-A / Type 2 helpers and operations */
  a: {
    ...aOps,
    utils: NfcAUtils,
  },

  /** NDEF read/write utilities and operations */
  ndef: {
    ...ndefOps,
    utils: NdefUtils,
  },
} as const;
