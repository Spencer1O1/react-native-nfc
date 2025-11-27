import nfcManager from "react-native-nfc-manager";

import { VError } from "../error";
import type { SystemInfo } from "../types";
import * as utils from "./utils";

export async function transceive(bytes: number[]) {
  return await nfcManager.nfcVHandler.transceive(bytes);
}

export async function readBlock(
  tagId: string,
  blockNumber: number,
): Promise<Uint8Array> {
  const uid = utils.reverseUid(tagId);
  const cmd = utils.buildReadBlock(uid, blockNumber);
  const resp = await transceive(cmd);
  return utils.parseReadResponse(resp);
}

export async function readBlocks(
  tagId: string,
  startBlock: number,
  endBlock: number,
) {
  const data = new Uint8Array();
  let offset = 0;
  for (let i = startBlock; i < endBlock; i++) {
    const block = await readBlock(tagId, i);
    data.set(block, offset);
    offset += block.length;
  }
  return data;
}

export async function writeBlock(
  tagId: string,
  blockNumber: number,
  data: Uint8Array,
): Promise<void> {
  const uid = utils.reverseUid(tagId);
  const cmd = utils.buildWriteBlock(uid, blockNumber, data);
  const resp = await transceive(cmd);
  utils.parseWriteResponse(resp);
}

export async function writeBlocks(
  tagId: string,
  blockNumber: number,
  data: Uint8Array[],
): Promise<void> {
  for (let i = 0; i < data.length; i++) {
    const blockData = data[i];
    if (blockData === undefined) {
      throw new VError(`No data provided for block at index ${i}`);
    }
    await writeBlock(tagId, blockNumber + i, blockData);
  }
}

export async function getSystemInfo(): Promise<SystemInfo> {
  const cmd = utils.buildGetSystemInfo();
  const resp = await transceive(cmd);
  return utils.parseSystemInfo(resp);
}
