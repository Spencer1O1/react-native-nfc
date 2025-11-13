import NfcManager, { TagEvent } from "react-native-nfc-manager";
import { nfcService } from "../service";
import { NfcVUtils } from "./utils";

export const operations = {
  async withVTag<T>(
    handler: (tag: TagEvent & { id: string }) => Promise<T>
  ): Promise<T> {
    return nfcService.withTechnology(NfcVUtils.tech, async () => {
      const tag = await NfcManager.getTag();
      if (!tag?.id) throw new Error("No NFC-V tag detected");
      return handler(tag as TagEvent & { id: string });
    });
  },

  async writeBlockNfcV(blockNumber: number, data: Uint8Array) {
    return this.withVTag(async (tag) => {
      const uid = NfcVUtils.reverseUid(tag.id);
      const cmd = NfcVUtils.buildWriteBlock(uid, blockNumber, data);
      const resp = await NfcManager.transceive(cmd);
      NfcVUtils.parseWriteResponse(resp);
    });
  },

  async readBlockNfcV(blockNumber: number) {
    return this.withVTag(async (tag) => {
      const uid = NfcVUtils.reverseUid(tag.id);
      const cmd = NfcVUtils.buildReadBlock(uid, blockNumber);
      const resp = await NfcManager.transceive(cmd);
      return NfcVUtils.parseReadResponse(resp);
    });
  },

  async getSystemInfoNfcV() {
    return this.withVTag(async (tag) => {
      const uid = NfcVUtils.reverseUid(tag.id);
      const cmd = NfcVUtils.buildGetSystemInfo(uid);
      const resp = await NfcManager.transceive(cmd);
      return NfcVUtils.parseSystemInfo(resp);
    });
  },
};
