import {
  type ISOLangCode,
  Ndef,
  type NdefRecord,
} from "react-native-nfc-manager";

import type { BuildRecordInit, NdefBuilder } from "./types";

export const mimeTypes = {
  TEXT: "text/plain",
  JSON: "application/json",
};

export class Builder {
  static records(b: NdefBuilder): NdefRecord[] {
    return b(Builder);
  }

  static message(b: NdefBuilder): number[] {
    return Ndef.encodeMessage(b(Builder));
  }

  static record(init: BuildRecordInit): NdefRecord {
    const { tnf, type, id = [], payload = [] } = init;

    // Convert strings → UTF-8 bytes
    const toBytes = (v: string | number[]) =>
      typeof v === "string" ? Array.from(Buffer.from(v, "utf8")) : v;

    return {
      tnf,
      type: toBytes(type),
      id: toBytes(id),
      payload: toBytes(payload),
    };
  }

  static textRecord(
    text: string,
    lang: ISOLangCode = "en",
    encoding: "utf8" | "utf16" = "utf8",
    id?: string,
  ): NdefRecord {
    const record = Ndef.textRecord(text, lang, encoding);
    if (id) record.id = Array.from(Buffer.from(id, "utf8"));
    return record;
  }

  static uriRecord(uri: string, id?: string): NdefRecord {
    return Ndef.uriRecord(uri, id);
  }

  static jsonRecord(
    payload: string | Uint8Array | number[],
    id?: string,
  ): NdefRecord {
    return Builder.mimeRecord(mimeTypes.JSON, payload, id);
  }

  static mimeRecord(
    mimeType: string,
    payload: string | Uint8Array | number[],
    id?: string,
  ): NdefRecord {
    const payloadBytes =
      typeof payload === "string"
        ? Array.from(Buffer.from(payload, "utf8"))
        : payload instanceof Uint8Array
          ? Array.from(payload)
          : payload;

    const idBytes = id ? Array.from(Buffer.from(id, "utf8")) : [];

    return Builder.record({
      tnf: Ndef.TNF_MIME_MEDIA,
      type: mimeType,
      id: idBytes,
      payload: payloadBytes,
    });
  }

  static externalRecord(
    domain: string,
    type: string,
    payload: string | Uint8Array | number[],
    id?: string,
  ): NdefRecord {
    const recordType = `${domain}:${type}`;
    const payloadBytes =
      typeof payload === "string"
        ? Array.from(Buffer.from(payload, "utf8"))
        : payload instanceof Uint8Array
          ? Array.from(payload)
          : payload;

    const idBytes = id ? Array.from(Buffer.from(id, "utf8")) : [];

    return Builder.record({
      tnf: Ndef.TNF_EXTERNAL_TYPE,
      type: recordType,
      id: idBytes,
      payload: payloadBytes,
    });
  }

  static createEmpty(): NdefRecord {
    return Builder.record({
      tnf: Ndef.TNF_EMPTY,
      type: [],
      id: [],
      payload: [],
    });
  }
}
