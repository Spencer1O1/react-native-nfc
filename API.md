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
  useNfcTech,
  useNfcTechLoop,
  useNfcTagEvent,
  useNfcTagEventLoop,
} from "@spencerls/react-native-nfc";
```

---

# Core Service: `nfcService`

```ts
import { nfcService } from "@spencerls/react-native-nfc";
```

The `nfcService` is a singleton that manages NFC operations using a job-based architecture with strategies for different operation types.

### Methods

#### startTech(tech, withTechnology, afterTechnology?, options?)

Starts a one-shot technology session. Executes once and completes.

```ts
await nfcService.startTech(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts
): Promise<void>
```

**Example:**
```ts
import { NfcTech } from "react-native-nfc-manager";

await nfcService.startTech(
  [NfcTech.NfcV],
  async () => {
    const tag = await nfcTag.getTag();
    console.log("Tag ID:", tag.id);
  }
);
```

#### startTechLoop(tech, withTechnology, afterTechnology?, options?)

Starts a continuous technology session loop. Automatically restarts after each tag interaction.

```ts
await nfcService.startTechLoop(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts
): Promise<void>
```

**Example:**
```ts
await nfcService.startTechLoop(
  [NfcTech.Ndef],
  async () => {
    const tag = await nfcTag.getTag();
    console.log("Tag detected:", tag.id);
  }
);
```

#### startTagEvent(onTag)

Starts a one-shot tag event handler. Executes once when a tag is detected.

```ts
await nfcService.startTagEvent(
  onTag: (tag: TagEvent) => Promise<void>
): Promise<void>
```

**Example:**
```ts
await nfcService.startTagEvent(async (tag) => {
  console.log("Tag ID:", tag.id);
});
```

#### startTagEventLoop(onTag, options?)

Starts a continuous tag event loop. Automatically restarts after each tag detection.

```ts
await nfcService.startTagEventLoop(
  onTag: (tag: TagEvent) => Promise<void>,
  options?: RegisterTagEventOpts
): Promise<void>
```

**Example:**
```ts
await nfcService.startTagEventLoop(
  async (tag) => {
    console.log("Tag detected:", tag.id);
  },
  { readerModeFlags: ... }
);
```

#### stop()

Stops all NFC operations and cleans up active sessions.

```ts
await nfcService.stop(): Promise<void>
```


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

These modules are used for advanced operations inside technology sessions.

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
await nfc.service.startTech([NfcTech.NfcV], async () => {
  const tag = await nfcTag.getTag();
  console.log("Tag ID:", tag.id);
});
```

---

## `nfcVTag`

```ts
import { nfcVTag } from "@spencerls/react-native-nfc";
```

Low-level NFC-V operations. Use inside technology sessions.

### Properties

- `tech`: NfcTech constant for NFC-V (use with technology sessions)
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
import { nfc, nfcTag, nfcVTag } from "@spencerls/react-native-nfc";

await nfc.service.startTech(nfcVTag.tech, async () => {
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

Low-level NDEF operations. Use inside technology sessions.

### Properties

- `tech`: NfcTech constant for NDEF (use with technology sessions)

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
import { nfc, nfcNdefTag } from "@spencerls/react-native-nfc";

await nfc.service.startTech(nfcNdefTag.tech, async () => {
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

## useNfcTech(tech, withTechnology, afterTechnology?, options?)

One-shot technology session. Executes once when triggered.

```ts
const { startTech } = useNfcTech(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts
);
```

**Example:**
```ts
import { useNfcTech, nfcTag } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

function ScanButton() {
  const { startTech } = useNfcTech(
    [NfcTech.NfcV],
    async () => {
      const tag = await nfcTag.getTag();
      console.log("Tag ID:", tag.id);
    }
  );

  return <Button title="Scan" onPress={startTech} />;
}
```

**With afterTechnology callback:**
```ts
const { startTech } = useNfcTech(
  [NfcTech.NfcV],
  async () => {
    const tag = await nfcTag.getTag();
    console.log("Tag ID:", tag.id);
  },
  async () => {
    console.log("Scan complete");
  }
);
```

---

## useNfcTechLoop(tech, withTechnology, afterTechnology?, options?)

Continuous technology session loop. Automatically restarts after each tag interaction.

```ts
const { start, stop, isRunning } = useNfcTechLoop(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts
);
```

**Example:**
```ts
import { useNfcTechLoop, nfcTag } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

function ContinuousScanScreen() {
  const { start, stop, isRunning } = useNfcTechLoop(
    [NfcTech.Ndef],
    async () => {
      const tag = await nfcTag.getTag();
      console.log("Tag detected:", tag.id);
    }
  );

  return (
    <View>
      <Button title={isRunning ? "Stop" : "Start"} onPress={isRunning ? stop : start} />
      <Text>{isRunning ? "Scanning..." : "Idle"}</Text>
    </View>
  );
}
```

**With afterTechnology callback:**
```ts
const { start, stop, isRunning } = useNfcTechLoop(
  [NfcTech.Ndef],
  async () => {
    const tag = await nfcTag.getTag();
    console.log("Tag detected:", tag.id);
  },
  async () => {
    console.log("Waiting for next tag...");
  }
);
```

---

## useNfcTagEvent(onTag)

One-shot tag event handler. Executes once when a tag is detected.

```ts
const { startTech } = useNfcTagEvent(
  onTag: (tag: TagEvent) => Promise<void>
);
```

**Example:**
```ts
import { useNfcTagEvent } from "@spencerls/react-native-nfc";

function QuickScan() {
  const { startTech } = useNfcTagEvent(async (tag) => {
    console.log("Tag ID:", tag.id);
  });

  return <Button title="Quick Scan" onPress={startTech} />;
}
```

---

## useNfcTagEventLoop(onTag, options?)

Continuous tag event loop. Automatically restarts after each tag detection.

```ts
const { start, stop, isRunning } = useNfcTagEventLoop(
  onTag: (tag: TagEvent) => Promise<void>,
  options?: RegisterTagEventOpts
);
```

**Example:**
```ts
import { useNfcTagEventLoop } from "@spencerls/react-native-nfc";

function MonitorScreen() {
  const { start, stop, isRunning } = useNfcTagEventLoop(
    async (tag) => {
      console.log("Tag detected:", tag.id);
    }
  );

  return (
    <View>
      <Button title={isRunning ? "Stop Monitoring" : "Start Monitoring"} 
              onPress={isRunning ? stop : start} />
    </View>
  );
}
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

Use `nfc.service.startTech()` with tag modules for complex custom operations.

```ts
// ✅ Advanced: custom multi-block read
await nfc.service.startTech(nfcVTag.tech, async () => {
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
  
  console.log("Data:", buffer);
});
```

## One-Shot vs Loop

### One-Shot Operations

Use for single tag interactions (scan once and done):

```ts
const { startTech } = useNfcTech(...);
// or
const { startTech } = useNfcTagEvent(...);
```

### Continuous Loops

Use for monitoring or multiple sequential tag interactions:

```ts
const { start, stop, isRunning } = useNfcTechLoop(...);
// or
const { start, stop, isRunning } = useNfcTagEventLoop(...);
```

---

# Internal Notes

- All APIs are 100% cross-platform (iOS and Android).
- Technology sessions are automatically managed and cleaned up.
- Hooks automatically stop sessions on component unmount.
- The service uses a job-based architecture with retry mechanisms.
- High-level `nfc.*` operations automatically manage technology sessions.
- For custom operations, use `nfc.service.startTech()` with low-level tag modules.
- Loop operations automatically restart after each tag interaction.

---

# License

MIT © Spencer Smith
