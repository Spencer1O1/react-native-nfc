import { operations as aOps, utils as aUtils } from "./a";
import { operations as ndefOps, utils as ndefUtils } from "./ndef";
import { nfcService } from "./service";
import { operations as vOps, utils as vUtils } from "./v";
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
    utils: vUtils,
  },

  /** NFC-A / Type 2 helpers and operations */
  a: {
    ...aOps,
    utils: aUtils,
  },

  /** NDEF read/write utilities and operations */
  ndef: {
    ...ndefOps,
    utils: ndefUtils,
  },
} as const;
