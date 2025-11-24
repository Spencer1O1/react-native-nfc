import { Ndef, type NdefRecord, type TagEvent } from "react-native-nfc-manager";

const toU8 = (v: number[] | Uint8Array | ArrayBuffer): Uint8Array => {
  if (v instanceof Uint8Array) return v;
  if (Array.isArray(v)) return Uint8Array.from(v);
  return new Uint8Array(v);
};

const toAscii = (u8: Uint8Array): string => String.fromCharCode(...u8);

function decodeRecord(record: {
  tnf: number;
  type: number[] | string;
  id?: number[];
  payload: number[];
}) {
  const { tnf } = record;

  // --- TYPE STRING -----------------------------------------------------
  let typeStr: string;
  if (typeof record.type === "string") {
    // iOS
    typeStr = record.type;
  } else {
    // Android
    typeStr = toAscii(toU8(record.type));
  }

  // --- PAYLOAD ---------------------------------------------------------
  const payloadU8 = toU8(record.payload);

  // ✅ TEXT RECORD
  if (tnf === Ndef.TNF_WELL_KNOWN && typeStr === "T") {
    const status = payloadU8[0];
    if (status === undefined) {
      throw new Error("Invalid TEXT record: missing status byte");
    }
    const langLen = status & 0x3f;
    const lang = toAscii(payloadU8.subarray(1, 1 + langLen));
    const textBytes = payloadU8.subarray(1 + langLen);
    const text = new TextDecoder().decode(textBytes);
    return { kind: "text", text, lang };
  }

  // ✅ URI RECORD
  if (tnf === Ndef.TNF_WELL_KNOWN && typeStr === "U") {
    const uri = Ndef.uri.decodePayload(payloadU8);
    return { kind: "uri", uri };
  }

  // ✅ MIME RECORD
  if (tnf === Ndef.TNF_MIME_MEDIA) {
    if (typeStr === "application/json") {
      return {
        kind: "mime",
        mimeType: typeStr,
        data: JSON.parse(new TextDecoder().decode(payloadU8)),
      };
    }

    function tryDecodeAsText(u8: Uint8Array): string | null {
      try {
        return new TextDecoder().decode(u8);
      } catch {
        return null;
      }
    }

    return {
      kind: "mime",
      mimeType: typeStr,
      data: payloadU8,
      text: typeStr.startsWith("text/") ? tryDecodeAsText(payloadU8) : null,
    };
  }

  // ✅ ABSOLUTE URI RECORD
  if (tnf === Ndef.TNF_ABSOLUTE_URI) {
    return {
      kind: "abs-uri",
      uri: typeStr,
      data: payloadU8,
    };
  }

  // ✅ EXTERNAL RECORD
  if (tnf === Ndef.TNF_EXTERNAL_TYPE) {
    return {
      kind: "external",
      type: typeStr,
      data: payloadU8,
    };
  }

  // ✅ UNKNOWN RECORD
  if (tnf === Ndef.TNF_UNKNOWN) {
    return {
      kind: "unknown",
      type: typeStr,
      data: payloadU8,
    };
  }

  // ✅ FALLBACK
  return {
    kind: "unknown",
    tnf,
    type: typeStr,
    payload: payloadU8,
  };
}

function decodeJson(record: NdefRecord) {
  if (record.tnf !== Ndef.TNF_MIME_MEDIA) return null;

  // Convert type to string
  const typeStr =
    typeof record.type === "string" ? record.type : toAscii(toU8(record.type));

  if (typeStr !== "application/json") return null;

  const payloadU8 = toU8(record.payload);
  const jsonText = new TextDecoder().decode(payloadU8);

  try {
    return JSON.parse(jsonText);
  } catch (err) {
    console.warn("Invalid JSON in NDEF:", err);
    return null;
  }
}

const encodeText = (text: string, lang = "en") => Ndef.textRecord(text, lang);

const encodeUri = (uri: string) => Ndef.uriRecord(uri);

function encodeJson(obj: any) {
  const json = JSON.stringify(obj);
  const payload = new TextEncoder().encode(json); // Uint8Array
  const typeArray = Array.from(new TextEncoder().encode("application/json"));

  return {
    tnf: Ndef.TNF_MIME_MEDIA,
    type: typeArray, // MUST be a number[] of ASCII bytes
    id: [],
    payload,
  };
}

function encodeMime(mimeType: string, data: Uint8Array) {
  const typeBytes = Array.from(new TextEncoder().encode(mimeType));

  return {
    tnf: Ndef.TNF_MIME_MEDIA,
    type: typeBytes,
    id: [],
    payload: data,
  };
}

// Android only
function willFit(tag: TagEvent, records: NdefRecord[]) {
  if (tag.maxSize === undefined) return null;

  const totalSize = Ndef.encodeMessage(records).length;
  return totalSize <= tag.maxSize;
}

// Android only
function spaceLeft(tag: TagEvent, records: NdefRecord[]) {
  if (tag.maxSize === undefined) return null;

  const totalSize = Ndef.encodeMessage(records).length;
  return tag.maxSize - totalSize;
}

export const NfcUtils = {
  Ndef: {
    decodeRecord,
    decodeJson,
    encodeText,
    encodeUri,
    encodeJson,
    encodeMime,
    willFit,
    spaceLeft,
  },
};
