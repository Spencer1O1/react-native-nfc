# @spencerls/react-native-nfc

A clean, React-friendly, **cross-platform** NFC layer built on top of  
`react-native-nfc-manager`.

## 🎯 Truly Cross-Platform

Write your NFC code once and it works on **both iOS and Android**.  
The only platform-specific code is the optional Android reader mode configuration.  
Everything else—reading, writing, and all NFC operations—uses the exact same API.

This package provides:

- A unified NFC service (`nfcService`)
- High-level protocol namespaces (`nfc.tag`, `nfc.v`, `nfc.ndef`)
- Low-level tag modules (`nfcTag`, `nfcVTag`, `nfcNdefTag`)
- Automatic iOS reader restarts
- Safe Android reader handling
- Optional React hooks and provider
- Technology sessions for NDEF/NfcV and raw commands
- Builder pattern for NDEF records

The API is designed to be stable, predictable, and easy to use across iOS and Android.

---

## Platform Support

| Feature | iOS | Android |
|---------|-----|---------|
| Reader Mode* | ❌ | ✅ |
| NDEF Read/Write | ✅ | ✅ |
| NFC-V (ISO15693) | ✅ | ✅ |
| Technology Sessions | ✅ | ✅ |
| React Hooks | ✅ | ✅ |

**\*Reader Mode** is Android's background NFC scanning API. iOS uses Technology Sessions instead.  
**Platform-specific code:** Only `enableReaderMode_ANDROID()` is Android-specific (no-op on iOS).  
All other APIs work identically on both platforms.

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

## Basic Usage (Reader Mode)

```tsx
import { useNfc, useNfcState, nfcService } from "@spencerls/react-native-nfc";
import { NfcAdapter } from "react-native-nfc-manager";

export default function ScannerScreen() {
  const { mode } = useNfcState();

  // Platform-specific: Configure Android reader mode (no-op on iOS)
  // Call once, typically at app startup or in useEffect
  nfcService.enableReaderMode_ANDROID(
    NfcAdapter.FLAG_READER_NFC_V |
    NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS
  );

  // Cross-platform: Works identically on iOS and Android
  useNfc((tagId) => {
    console.log("Scanned:", tagId);
  }, {
    cooldownMs: 800
  });

  return (
    <View>
      <Text>NFC Mode: {mode}</Text>
    </View>
  );
}
```

---

## Manual Reader Control

```tsx
import { useNfcReader, nfcService } from "@spencerls/react-native-nfc";
import { NfcAdapter } from "react-native-nfc-manager";

export default function Screen() {
  const { start, stop } = useNfcReader();

  // Platform-specific: Configure Android reader mode (no-op on iOS)
  nfcService.enableReaderMode_ANDROID(NfcAdapter.FLAG_READER_NFC_V);

  const begin = () => {
    // Cross-platform: Works identically on iOS and Android
    start(
      (tag) => {
        console.log("Tag:", tag.id);
      },
      { cooldownMs: 1200 }
    );
  };

  return <Button title="Start" onPress={begin} />;
}
```

---

## Get Basic Tag Information

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

export default function ScanTagButton() {
  const scanTag = async () => {
    const tag = await nfc.tag.getTag([
      NfcTech.NfcA,
      NfcTech.NfcV,
      NfcTech.Ndef,
    ]);
    console.log("Tag ID:", tag.id);
    console.log("Tag Type:", tag.type);
  };

  return <Button title="Scan Tag" onPress={scanTag} />;
}
```

---

## NDEF Write with Builder

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";

export default function WriteNdefButton() {
  const writeNdef = async () => {
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
  };

  return <Button title="Write NDEF" onPress={writeNdef} />;
}
```

---

## NDEF Read

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";

export default function ReadNdefButton() {
  const readNdef = async () => {
    const { message, tag } = await nfc.ndef.readFull();
    console.log("Tag ID:", tag.id);
    console.log("Records:", message.ndefMessage);
  };

  return <Button title="Read NDEF" onPress={readNdef} />;
}
```

---

## Custom NFC-V Operations

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc, nfcTag, nfcVTag } from "@spencerls/react-native-nfc";

export default function ReadNfcVButton() {
  const readCustom = async () => {
    const data = await nfc.service.withTechnology(nfcVTag.tech, async () => {
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
    
    console.log("Data:", data);
  };

  return <Button title="Read NFC-V" onPress={readCustom} />;
}
```

---

## High-Level NFC-V Operations

**Cross-platform:** Works identically on iOS and Android.

```tsx
import { nfc } from "@spencerls/react-native-nfc";

export default function NfcVScreen() {
  const readBlock = async () => {
    const data = await nfc.v.readBlock(0);
    console.log("Block 0:", data);
  };

  const writeBlock = async () => {
    const data = new Uint8Array([0x01, 0x02, 0x03, 0x04]);
    await nfc.v.writeBlock(0, data);
  };

  const getInfo = async () => {
    const info = await nfc.v.getSystemInfo();
    console.log("System Info:", info);
  };

  return (
    <View>
      <Button title="Read Block" onPress={readBlock} />
      <Button title="Write Block" onPress={writeBlock} />
      <Button title="Get Info" onPress={getInfo} />
    </View>
  );
}
```

---

## API Overview

**Cross-platform:** All APIs below work identically on iOS and Android.

```ts
import { nfc, nfcTag, nfcVTag, nfcNdefTag } from "@spencerls/react-native-nfc";

// High-level namespace operations (auto-manages technology sessions)
await nfc.tag.getTag([NfcTech.NfcV]);
await nfc.v.readBlock(0);
await nfc.v.writeBlock(0, data);
await nfc.v.getSystemInfo();
await nfc.ndef.write(records);
await nfc.ndef.readMessage();
await nfc.ndef.readFull();

// Low-level tag modules (use inside withTechnology)
await nfc.service.withTechnology(nfcVTag.tech, async () => {
  const tag = await nfcTag.getTag();
  const block = await nfcVTag.readBlock(tag.id, 0);
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
nfc.service.enableReaderMode_ANDROID(flags); // Android-only (no-op on iOS)
await nfc.service.startReader(onTag, options); // Cross-platform
await nfc.service.stopReader(); // Cross-platform
```

---

## Global Provider (Optional)

```tsx
import { NfcProvider } from "@spencerls/react-native-nfc";

export default function App() {
  return (
    <NfcProvider>
      <RootApp />
    </NfcProvider>
  );
}
```

---

## License

MIT © Spencer Smith
