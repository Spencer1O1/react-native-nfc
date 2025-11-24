import NfcManager, {
  Ndef,
  type NdefRecord,
  NfcTech,
} from "react-native-nfc-manager";

import { nfcService } from "../nfc/service";

export function useNfcTechnology() {
  async function writeNdef(records: NdefRecord[]) {
    return nfcService.withTechnology(NfcTech.Ndef, async () => {
      const bytes = Ndef.encodeMessage(records);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
    });
  }

  async function runWithTech(
    tech: NfcTech | NfcTech[],
    fn: () => Promise<void>,
  ) {
    return nfcService.withTechnology(tech, fn);
  }

  return {
    writeNdef,
    runWithTech,
  };
}
