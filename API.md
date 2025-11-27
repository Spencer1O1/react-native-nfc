# @spencerls/react-native-nfc – API Reference

This document describes the complete public API surface of the NFC package.

All exports come from:

```ts
import { 
  nfc, 
  nfcService,
  nfcTag,
  nfcVTag,
  nfcNdefTag
} from "@spencerls/react-native-nfc";

import {
  useNfc,
  useNfcState,
  useNfcReader,
  useNfcTechnology,
} from "@spencerls/react-native-nfc";
```

---

# Core Service: `nfcService`

```ts
import { nfcService } from "@spencerls/react-native-nfc";
```

### Methods

#### enableReaderMode_ANDROID(flags)
Configures Android reader mode flags. Must be called before `startReader()` or `withTechnology()`.  
No-op on iOS.

```ts
nfcService.enableReaderMode_ANDROID(flags: number);
```

**Example:**
```ts
import { NfcAdapter } from "react-native-nfc-manager";

nfcService.enableReaderMode_ANDROID(
  NfcAdapter.FLAG_READER_NFC_V | NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS
);
```

#### startReader(onTag, options?)
Starts platform reader mode.

```ts
nfcService.startReader(
  onTag?: (tag: TagEvent) => void,
  options?: { cooldownMs?: number }
)
```

#### stopReader()
Stops reader mode.

```ts
await nfcService.stopReader();
```

#### withTechnology(tech, handler)
Opens an iOS/Android technology session.

```ts
await nfcService.withTechnology(
  tech: NfcTech | NfcTech[],
  async () => { /* commands */ }
);
```

#### getState()
Returns the current state snapshot.

```ts
{ mode, tag }
```

#### subscribe(listener)
Attach a state listener; returns an unsubscribe function.

---

# Namespace API: `nfc`

```ts
import { nfc } from "@spencerls/react-native-nfc";
```

`nfc` is a namespaced, high-level interface that automatically manages technology sessions:

```
nfc.service        (NfcService instance)
nfc.tag.*          Basic tag operations
nfc.v.*            NFC-V (ISO15693) operations
nfc.ndef.*         NDEF operations
```

---

# Tag Namespace: `nfc.tag`

Get basic tag information.

### getTag(tech)

Requests technology session and returns tag information.

```ts
await nfc.tag.getTag(tech: NfcTech | NfcTech[]): Promise<TagEvent>
```

**Example:**
```ts
import { NfcTech } from "react-native-nfc-manager";

const tag = await nfc.tag.getTag([NfcTech.NfcA, NfcTech.NfcV, NfcTech.Ndef]);
console.log("Tag ID:", tag.id);
console.log("Tag Type:", tag.type);
```

---

# NFC-V Namespace: `nfc.v`

High-level ISO15693 (NFC-V) operations. Automatically manages technology sessions.

### readBlock(blockNumber)

```ts
await nfc.v.readBlock(blockNumber: number): Promise<Uint8Array>
```

### readBlocks(startBlock, endBlock)

```ts
await nfc.v.readBlocks(
  startBlock: number, 
  endBlock: number
): Promise<Uint8Array>
```

### writeBlock(blockNumber, data)

```ts
await nfc.v.writeBlock(
  blockNumber: number, 
  data: Uint8Array
): Promise<void>
```

### writeBlocks(blockNumber, data)

```ts
await nfc.v.writeBlocks(
  blockNumber: number, 
  data: Uint8Array[]
): Promise<void>
```

### getSystemInfo()

```ts
await nfc.v.getSystemInfo(): Promise<SystemInfo>
```

**Example:**
```ts
const info = await nfc.v.getSystemInfo();
console.log("Blocks:", info.numberOfBlocks);
console.log("Block size:", info.blockSize);
```

---

# NDEF Namespace: `nfc.ndef`

High-level NDEF operations and builder.

### write(records)

Writes NDEF records to a tag.

```ts
await nfc.ndef.write(records: NdefRecord[]): Promise<void>
```

### writeText(text, lang?, encoding?, id?)

```ts
await nfc.ndef.writeText(
  text: string,
  lang?: ISOLangCode,
  encoding?: "utf8" | "utf16",
  id?: string
): Promise<void>
```

### writeUri(uri, id?)

```ts
await nfc.ndef.writeUri(uri: string, id?: string): Promise<void>
```

### writeJson(data, id?)

```ts
await nfc.ndef.writeJson(data: unknown, id?: string): Promise<void>
```

### writeMime(mimeType, payload, id?)

```ts
await nfc.ndef.writeMime(
  mimeType: string,
  payload: string | Uint8Array | number[],
  id?: string
): Promise<void>
```

### writeExternal(domain, type, payload, id?)

```ts
await nfc.ndef.writeExternal(
  domain: string,
  type: string,
  payload: string | Uint8Array | number[],
  id?: string
): Promise<void>
```

### readMessage()

```ts
await nfc.ndef.readMessage(): Promise<NdefMessageResult>
```

### readFull()

Reads NDEF message and tag information.

```ts
await nfc.ndef.readFull(): Promise<{
  message: NdefMessageResult;
  tag: TagEvent;
}>
```

### getStatus()

```ts
await nfc.ndef.getStatus(): Promise<{
  status: NdefStatus;
  capacity: number;
}>
```

### makeReadOnly()

```ts
await nfc.ndef.makeReadOnly(): Promise<void>
```

---

# NDEF Builder: `nfc.ndef.Builder`

Create NDEF records using a builder pattern.

### Builder.records(builder)

```ts
nfc.ndef.Builder.records((B) => NdefRecord[]): NdefRecord[]
```

**Example:**
```ts
const records = nfc.ndef.Builder.records((B) => [
  B.textRecord("Hello, world!"),
  B.uriRecord("https://example.com"),
  B.jsonRecord(JSON.stringify({ key: "value" })),
]);

await nfc.ndef.write(records);
```

### Builder Methods

#### textRecord(text, lang?, encoding?, id?)

```ts
Builder.textRecord(
  text: string,
  lang: ISOLangCode = "en",
  encoding: "utf8" | "utf16" = "utf8",
  id?: string
): NdefRecord
```

#### uriRecord(uri, id?)

```ts
Builder.uriRecord(uri: string, id?: string): NdefRecord
```

#### jsonRecord(json, id?)

```ts
Builder.jsonRecord(
  json: string | Uint8Array | number[],
  id?: string
): NdefRecord
```

#### mimeRecord(mimeType, payload, id?)

```ts
Builder.mimeRecord(
  mimeType: string,
  payload: string | Uint8Array | number[],
  id?: string
): NdefRecord
```

#### externalRecord(domain, type, payload, id?)

```ts
Builder.externalRecord(
  domain: string,
  type: string,
  payload: string | Uint8Array | number[],
  id?: string
): NdefRecord
```

#### record(init)

Low-level record builder.

```ts
Builder.record(init: {
  tnf: number;
  type: string | number[];
  id?: string | number[];
  payload?: string | number[];
}): NdefRecord
```

---

# Low-Level Tag Modules

These modules are used for advanced operations inside `withTechnology` sessions.

## `nfcTag`

```ts
import { nfcTag } from "@spencerls/react-native-nfc";
```

### getTag()

Gets the current tag within a technology session.

```ts
await nfcTag.getTag(): Promise<TagEvent>
```

**Example:**
```ts
await nfc.service.withTechnology(NfcTech.NfcV, async () => {
  const tag = await nfcTag.getTag();
  console.log("Tag ID:", tag.id);
});
```

---

## `nfcVTag`

```ts
import { nfcVTag } from "@spencerls/react-native-nfc";
```

Low-level NFC-V operations. Use inside `withTechnology` sessions.

### Properties

- `tech`: NfcTech constant for NFC-V (use with `withTechnology`)
- `utils`: ISO15693 utility functions

### Methods

#### readBlock(tagId, blockNumber)

```ts
await nfcVTag.readBlock(tagId: string, blockNumber: number): Promise<Uint8Array>
```

#### readBlocks(tagId, startBlock, endBlock)

```ts
await nfcVTag.readBlocks(
  tagId: string,
  startBlock: number,
  endBlock: number
): Promise<Uint8Array>
```

#### writeBlock(tagId, blockNumber, data)

```ts
await nfcVTag.writeBlock(
  tagId: string,
  blockNumber: number,
  data: Uint8Array
): Promise<void>
```

#### writeBlocks(tagId, blockNumber, data)

```ts
await nfcVTag.writeBlocks(
  tagId: string,
  blockNumber: number,
  data: Uint8Array[]
): Promise<void>
```

#### getSystemInfo()

```ts
await nfcVTag.getSystemInfo(): Promise<SystemInfo>
```

#### transceive(bytes)

Send raw ISO15693 command.

```ts
await nfcVTag.transceive(bytes: number[]): Promise<number[]>
```

**Example:**
```ts
import { nfcTag, nfcVTag } from "@spencerls/react-native-nfc";

await nfc.service.withTechnology(nfcVTag.tech, async () => {
  const tag = await nfcTag.getTag();
  if (!tag?.id) throw new Error("No tag detected");
  
  const block = await nfcVTag.readBlock(tag.id, 0);
  console.log("Block 0:", block);
});
```

---

## `nfcNdefTag`

```ts
import { nfcNdefTag } from "@spencerls/react-native-nfc";
```

Low-level NDEF operations. Use inside `withTechnology` sessions.

### Properties

- `tech`: NfcTech constant for NDEF (use with `withTechnology`)

### Methods

#### readMessage()

```ts
await nfcNdefTag.readMessage(): Promise<NdefMessageResult>
```

#### write(records)

```ts
await nfcNdefTag.write(records: NdefRecord[]): Promise<void>
```

**Example:**
```ts
import { nfcNdefTag } from "@spencerls/react-native-nfc";

await nfc.service.withTechnology(nfcNdefTag.tech, async () => {
  const message = await nfcNdefTag.readMessage();
  console.log("Records:", message.ndefMessage);
});
```

---

# React Hooks

All hooks live under:

```ts
import { ... } from "@spencerls/react-native-nfc";
```

---

## useNfc(onTag, options)

Automatically starts reader mode on mount and stops on unmount.

**Note:** Call `nfcService.enableReaderMode_ANDROID(flags)` before using this hook on Android.

```ts
useNfc(
  (tagId: string) => { ... },
  {
    cooldownMs?: number
  }
);
```

**Example:**
```ts
import { nfcService } from "@spencerls/react-native-nfc";
import { NfcAdapter } from "react-native-nfc-manager";

// Call once at app startup
nfcService.enableReaderMode_ANDROID(NfcAdapter.FLAG_READER_NFC_V);

// Then use the hook
useNfc((tagId) => {
  console.log("Scanned:", tagId);
}, { cooldownMs: 800 });
```

---

## useNfcState()

Access current NFC state:

```tsx
const { mode, tag } = useNfcState();
```

---

## useNfcReader()

Manual control over reader mode.

**Note:** Call `nfcService.enableReaderMode_ANDROID(flags)` before calling `start()` on Android.

```ts
const { start, stop } = useNfcReader();

// start signature:
start(onTag?: (tag: TagEvent) => void, options?: { cooldownMs?: number })
```

---

## useNfcTechnology()

Runs an NFC technology session (NfcV, Ndef, etc).

```ts
await runWithTech([NfcTech.NfcV], async () => {
  const info = await nfc.v.getSystemInfoNfcV();
});
```

---

# Types

All types are exported from `@spencerls/react-native-nfc/nfc`.

Notable types:

```ts
NfcState
NfcMode
TagEvent
```

---

# Usage Patterns

## High-Level vs Low-Level

### High-Level (Recommended)

Use `nfc.*` namespace operations for most tasks. These automatically manage technology sessions.

```ts
// ✅ Simple and clean
const data = await nfc.v.readBlock(0);
await nfc.ndef.write(records);
```

### Low-Level (Advanced)

Use tag modules (`nfcTag`, `nfcVTag`, `nfcNdefTag`) inside `withTechnology` for complex operations.

```ts
// ✅ Advanced: custom multi-block read
await nfc.service.withTechnology(nfcVTag.tech, async () => {
  const tag = await nfcTag.getTag();
  if (!tag?.id) throw new Error("No NFC-V tag detected");
  
  const buffer = new Uint8Array();
  let offset = 0;
  
  // Read blocks 0, 2, 4, 6
  for (let i = 0; i < 8; i += 2) {
    const block = await nfcVTag.readBlock(tag.id, i);
    buffer.set(block, offset);
    offset += block.length;
  }
  
  return buffer;
});
```

---

# Internal Notes

- **Android reader mode flags** must be configured via `enableReaderMode_ANDROID()` before starting reader mode or using technology sessions.
- iOS automatically restarts reader mode after each scan.
- Android waits for cooldown before accepting next scan.
- Technology sessions interrupt reader mode safely and auto-restart when done.
- `NfcTech` enums must be used. Do not pass raw strings.
- High-level `nfc.*` operations automatically manage technology sessions.
- Low-level tag modules require manual `withTechnology` wrapping.

---

# License

MIT © Spencer Smith
