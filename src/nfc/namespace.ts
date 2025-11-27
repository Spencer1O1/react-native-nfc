import { Builder as NdefBuilder, operations as ndefOps } from "./ndef";
import { nfcService } from "./service";
import { operations as tagOps } from "./tag";
import { operations as vOps } from "./v";
/**
 * NFC root namespace providing access to:
 * - NfcService
 * - ISO15693 NFC-V ops
 * - NDEF operations
 */
export const nfc = {
  service: nfcService,
  v: { ...vOps },
  ndef: { ...ndefOps, Builder: NdefBuilder },
  tag: { ...tagOps },
} as const;
