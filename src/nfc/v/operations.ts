import { NfcPrimitives } from "../primitives";
import { nfcTag } from "../tag";
import { VError } from "./error";
import { nfcVTag } from "./internal";
import type { SystemInfo } from "./types";

export async function writeBlock(
  blockNumber: number,
  data: Uint8Array,
): Promise<void> {
  await NfcPrimitives.withTechnology(nfcVTag.tech, async () => {
    const tag = await nfcTag.getTag();
    if (!tag?.id) throw new VError("No NFC-V tag id detected");
    await nfcVTag.writeBlock(tag.id, blockNumber, data);
  });
}

export async function writeBlocks(
  blockNumber: number,
  data: Uint8Array[],
): Promise<void> {
  await NfcPrimitives.withTechnology(nfcVTag.tech, async () => {
    const tag = await nfcTag.getTag();
    if (!tag?.id) throw new VError("No NFC-V tag id detected");
    nfcVTag.writeBlocks(tag.id, blockNumber, data);
  });
}

export async function readBlock(blockNumber: number): Promise<Uint8Array> {
  return await NfcPrimitives.withTechnology(nfcVTag.tech, async () => {
    const tag = await nfcTag.getTag();
    if (!tag?.id) throw new VError("No NFC-V tag id detected");
    return await nfcVTag.readBlock(tag.id, blockNumber);
  });
}

export async function readBlocks(
  startBlock: number,
  endBlock: number,
): Promise<Uint8Array> {
  return await NfcPrimitives.withTechnology(nfcVTag.tech, async () => {
    const tag = await nfcTag.getTag();
    if (!tag?.id) throw new Error("No NFC-V tag id detected");
    return await nfcVTag.readBlocks(tag.id, startBlock, endBlock);
  });
}

export async function getSystemInfo(): Promise<SystemInfo> {
  return await NfcPrimitives.withTechnology(nfcVTag.tech, nfcVTag.getSystemInfo);
}
