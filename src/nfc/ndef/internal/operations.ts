import nfcManager, { Ndef, type NdefRecord } from "react-native-nfc-manager";

import { NdefError } from "../error";
import type { NdefMessageResult } from "../types";

function assertMessage(msg: NdefMessageResult) {
  if (!msg.ndefMessage || msg.ndefMessage.length === 0) {
    throw new NdefError("NDEF message contains no NDEF records");
  }
}

export async function readMessage(): Promise<NdefMessageResult> {
  // getNdefMessage does NOT return TagEvent. NfcManager is wrong.
  const msg =
    (await nfcManager.ndefHandler.getNdefMessage()) as unknown as NdefMessageResult | null;
  if (!msg) throw new NdefError("No NDEF message detected");

  assertMessage(msg);

  return msg;
}
export async function write(records: NdefRecord[]): Promise<void> {
  if (records.length === 0) {
    throw new NdefError("Cannot write an empty records array");
  }

  const bytes = Ndef.encodeMessage(records);
  await nfcManager.ndefHandler.writeNdefMessage(bytes);
}
