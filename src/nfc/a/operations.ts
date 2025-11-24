import NfcManager, { NfcTech } from "react-native-nfc-manager";

import { nfcService } from "../service";

export const operations = {
  async transceive(data: number[]) {
    return nfcService.withTechnology(NfcTech.NfcA, async () => {
      return await NfcManager.transceive(data);
    });
  },
};
