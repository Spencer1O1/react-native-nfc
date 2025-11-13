import NfcManager, {
  Ndef,
  NdefRecord,
  NfcTech,
} from "react-native-nfc-manager";
import { nfcService } from "../service";

export const operations = {
  async writeNdef(records: NdefRecord[]) {
    // Use NFC-A/Type 2 as fallback (often required on Android)
    await nfcService.withTechnology([NfcTech.Ndef, NfcTech.NfcA], async () => {
      const bytes = Ndef.encodeMessage(records);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
    });
  },

  writeTextNdef(text: string) {
    const record = Ndef.textRecord(text);
    return this.writeNdef([record]);
  },

  writeUriNdef(uri: string) {
    const record = Ndef.uriRecord(uri);
    return this.writeNdef([record]);
  },
};
