import NfcManager from "react-native-nfc-manager";

import { nfcService } from "../service";
import {
  getSystemInfoRaw,
  readBlockRaw,
  type StrictTagEvent,
  writeBlockRaw,
} from "./internal";
import { utils } from "./utils";

export const operations = {
  async withVTag<T>(handler: (tag: StrictTagEvent) => Promise<T>): Promise<T> {
    return nfcService.withTechnology(utils.tech, async () => {
      const tag = await NfcManager.getTag();
      if (!tag?.id) throw new Error("No NFC-V tag detected");
      return handler(tag as StrictTagEvent);
    });
  },

  async writeBlockNfcV(blockNumber: number, data: Uint8Array) {
    return this.withVTag((tag) => writeBlockRaw(tag, blockNumber, data));
  },

  async readBlockNfcV(blockNumber: number) {
    return this.withVTag((tag) => readBlockRaw(tag, blockNumber));
  },

  async getSystemInfoNfcV() {
    return this.withVTag((tag) => getSystemInfoRaw(tag));
  },
};
