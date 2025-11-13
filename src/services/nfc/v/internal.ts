import NfcManager, { TagEvent } from "react-native-nfc-manager";
import { utils } from "./utils";

export type StrictTagEvent = TagEvent & {
  id: string;
};

export async function readBlockRaw(tag: StrictTagEvent, blockNumber: number) {
  const uid = utils.reverseUid(tag.id);
  const cmd = utils.buildReadBlock(uid, blockNumber);
  const resp = await NfcManager.transceive(cmd);
  return utils.parseReadResponse(resp);
}

export async function writeBlockRaw(
  tag: StrictTagEvent,
  blockNumber: number,
  data: Uint8Array
) {
  const uid = utils.reverseUid(tag.id);
  const cmd = utils.buildWriteBlock(uid, blockNumber, data);
  const resp = await NfcManager.transceive(cmd);
  return utils.parseWriteResponse(resp);
}

export async function getSystemInfoRaw(tag: StrictTagEvent) {
  const uid = utils.reverseUid(tag.id);
  const cmd = utils.buildGetSystemInfo(uid);
  const resp = await NfcManager.transceive(cmd);
  return utils.parseSystemInfo(resp);
}
