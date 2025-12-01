import nfcManager, {
  type ISOLangCode,
  type NdefRecord,
  type NdefStatus,
  type TagEvent,
} from "react-native-nfc-manager";

import { nfcTag } from "../tag";
import { Builder } from "./builder";
import { NdefError } from "./error";
import { nfcNdefTag } from "./internal";
import type { NdefMessageResult } from "./types";
import { NfcPrimitives } from "../primitives";

export async function getStatus(): Promise<{
  status: NdefStatus;
  capacity: number;
}> {
  return await nfcManager.ndefHandler.getNdefStatus();
}

export async function readMessage(): Promise<NdefMessageResult> {
  return await NfcPrimitives.withTechnology(
    nfcNdefTag.tech,
    nfcNdefTag.readMessage,
  );
}

export async function readFull(): Promise<{
  message: NdefMessageResult;
  tag: TagEvent;
}> {
  return await NfcPrimitives.withTechnology(nfcNdefTag.tech, async () => {
    const tag = await nfcTag.getTag();
    const message = await nfcNdefTag.readMessage();
    return { message, tag };
  });
}

export async function write(records: NdefRecord[]): Promise<void> {
  if (!records || records.length === 0) {
    throw new NdefError("write: no NDEF records provided");
  }
  await NfcPrimitives.withTechnology(
    nfcNdefTag.tech,
    async () => await nfcNdefTag.write(records),
  );
}

export async function writeText(
  text: string,
  lang?: ISOLangCode,
  encoding?: "utf8" | "utf16",
  id?: string,
): Promise<void> {
  const rec = Builder.textRecord(text, lang, encoding, id);
  await write([rec]);
}

export async function writeUri(uri: string, id?: string): Promise<void> {
  const rec = Builder.uriRecord(uri, id);
  await write([rec]);
}

export async function writeJson(data: unknown, id?: string): Promise<void> {
  let json: string;
  try {
    json = JSON.stringify(data);
  } catch (e) {
    throw new NdefError(`writeJson: value is not JSON serializable: ${e}`);
  }

  const rec = Builder.jsonRecord(json, id);
  await write([rec]);
}

export async function writeMime(
  mimeType: string,
  payload: string | Uint8Array | number[],
  id?: string,
): Promise<void> {
  if (!mimeType || typeof mimeType !== "string") {
    throw new NdefError("writeMime: mimeType must be a non-empty string");
  }

  const rec = Builder.mimeRecord(mimeType, payload, id);
  await write([rec]);
}

export async function writeExternal(
  domain: string,
  type: string,
  payload: string | Uint8Array | number[],
  id?: string,
): Promise<void> {
  if (!domain || typeof domain !== "string") {
    throw new NdefError("writeExternal: domain must be a non-empty string");
  }
  if (!type || typeof type !== "string") {
    throw new NdefError("writeExternal: type must be a non-empty string");
  }

  const rec = Builder.externalRecord(domain, type, payload, id);
  await write([rec]);
}

export async function makeReadOnly(): Promise<void> {
  await NfcPrimitives.withTechnology(
    nfcNdefTag.tech,
    nfcManager.ndefHandler.makeReadOnly,
  );
}
