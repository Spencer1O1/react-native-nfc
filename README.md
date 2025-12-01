# @spencerls/react-native-nfc

A clean, React-friendly, **cross-platform** NFC layer built on top of  
`react-native-nfc-manager`.

## 🎯 Truly Cross-Platform

Write your NFC code once and it works on **both iOS and Android**.  
All NFC operations use the exact same API across platforms.

This package provides:

- A unified NFC service with job-based architecture (`nfcService`)
- High-level protocol namespaces (`nfc.tag`, `nfc.v`, `nfc.ndef`)
- Low-level tag modules (`nfcTag`, `nfcVTag`, `nfcNdefTag`)
- React hooks for one-shot and continuous NFC sessions
- Technology sessions for NDEF/NfcV and raw commands
- Builder pattern for NDEF records
- Automatic session management and cleanup

The API is designed to be stable, predictable, and easy to use across iOS and Android.

---

## Platform Support

| Feature | iOS | Android |
|---------|-----|---------|
| Technology Sessions | ✅ | ✅ |
| Tag Event Handling | ✅ | ✅ |
| NDEF Read/Write | ✅ | ✅ |
| NFC-V (ISO15693) | ✅ | ✅ |
| React Hooks | ✅ | ✅ |

**100% Cross-Platform** - All APIs work identically on both platforms.

---

## Installation

```bash
npm install @spencerls/react-native-nfc
npm install react-native-nfc-manager
```

Works with:

- React Native 0.74+
- Expo (Bare / Prebuild)
- iOS 13+ (Core NFC)
- Android API 21+

---

## Quick Start

### One-Shot Tag Read

```tsx
import { useNfcTech, nfcTag } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

export default function ScanButton() {
  const { startTech } = useNfcTech(
    [NfcTech.Ndef, NfcTech.NfcV],
    async () => {
      const tag = await nfcTag.getTag();
      console.log("Tag ID:", tag.id);
    }
  );

  return <Button title="Scan NFC" onPress={startTech} />;
}
```

### Continuous Tag Scanning

```tsx
import { useNfcTechLoop, nfcTag } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

export default function ContinuousScanScreen() {
  const { start, stop, isRunning } = useNfcTechLoop(
    [NfcTech.Ndef, NfcTech.NfcV],
    async () => {
      const tag = await nfcTag.getTag();
      console.log("Tag detected:", tag.id);
    }
  );

  return (
    <View>
      <Button title={isRunning ? "Stop" : "Start"} onPress={isRunning ? stop : start} />
      <Text>Status: {isRunning ? "Scanning..." : "Idle"}</Text>
    </View>
  );
}
```

---

## High-Level Operations

### Get Basic Tag Information

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

const tag = await nfc.tag.getTag([NfcTech.NfcA, NfcTech.NfcV, NfcTech.Ndef]);
console.log("Tag ID:", tag.id);
console.log("Tag Type:", tag.type);
```

---

### NDEF Write with Builder

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";

await nfc.ndef.write(
  nfc.ndef.Builder.records((B) => [
    B.textRecord("Hello, world!"),
    B.uriRecord("https://www.google.com"),
    B.jsonRecord(
      JSON.stringify({
        name: "John Doe",
        age: 30,
        email: "john.doe@example.com",
      })
    ),
  ])
);
```

---

### NDEF Read

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";

const { message, tag } = await nfc.ndef.readFull();
console.log("Tag ID:", tag.id);
console.log("Records:", message.ndefMessage);
```

---

### High-Level NFC-V Operations

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";

// Read a single block
const data = await nfc.v.readBlock(0);
console.log("Block 0:", data);

// Write a single block
const writeData = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
await nfc.v.writeBlock(0, writeData);

// Get system info
const info = await nfc.v.getSystemInfo();
console.log("Blocks:", info.numberOfBlocks);
console.log("Block size:", info.blockSize);
```

---

## Advanced: Custom NFC-V Operations

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc, nfcTag, nfcVTag } from "@spencerls/react-native-nfc";

await nfc.service.startTech(
  nfcVTag.tech,
  async () => {
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
  }
);
```

---

## React Hooks Reference

### useNfcTech

One-shot technology session. Executes once when triggered.

```tsx
const { startTech } = useNfcTech(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts
);
```

### useNfcTechLoop

Continuous technology session loop. Automatically restarts after each tag.

```tsx
const { start, stop, isRunning } = useNfcTechLoop(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts
);
```

### useNfcTagEvent

One-shot tag event. Executes once when a tag is detected.

```tsx
const { startTech } = useNfcTagEvent(
  onTag: (tag: TagEvent) => Promise<void>
);
```

### useNfcTagEventLoop

Continuous tag event loop. Automatically restarts after each tag.

```tsx
const { start, stop, isRunning } = useNfcTagEventLoop(
  onTag: (tag: TagEvent) => Promise<void>,
  options?: RegisterTagEventOpts
);
```

---

## API Overview

**Cross-platform:** All APIs work identically on iOS and Android.

```ts
import { 
  nfc, 
  nfcService, 
  nfcTag, 
  nfcVTag, 
  nfcNdefTag
} from "@spencerls/react-native-nfc";

// High-level namespace operations (auto-manages technology sessions)
await nfc.tag.getTag([NfcTech.NfcV]);
await nfc.v.readBlock(0);
await nfc.v.writeBlock(0, data);
await nfc.v.getSystemInfo();
await nfc.ndef.write(records);
await nfc.ndef.readMessage();
await nfc.ndef.readFull();

// Custom operations using service
await nfc.service.startTech(nfcVTag.tech, async () => {
  const tag = await nfcTag.getTag();
  const block = await nfcVTag.readBlock(tag.id, 0);
  console.log(block);
});

// NDEF Builder
const records = nfc.ndef.Builder.records((B) => [
  B.textRecord("Hello"),
  B.uriRecord("https://example.com"),
  B.jsonRecord(JSON.stringify({ key: "value" })),
  B.mimeRecord("text/plain", "data"),
  B.externalRecord("example.com", "type", "payload"),
]);

// Service control
await nfcService.startTech(tech, withTech);
await nfcService.startTechLoop(tech, withTech);
await nfcService.startTagEvent(onTag);
await nfcService.startTagEventLoop(onTag);
await nfcService.stop();
```

---

## License

MIT © Spencer Smith
