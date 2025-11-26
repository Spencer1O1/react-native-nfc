# @spencerls/react-native-nfc

A clean, React-friendly, cross-platform NFC layer built on top of  
`react-native-nfc-manager`.

This package provides:

- A unified NFC service (`nfcService`)
- High-level protocol namespaces (`nfc.v`, `nfc.a`, `nfc.ndef`)
- Automatic iOS reader restarts
- Safe Android reader handling
- Optional React hooks and provider
- Technology sessions for NDEF/NfcV/NfcA and raw commands

The API is designed to be stable, predictable, and easy to use across iOS and Android.

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

  // Enable Android reader mode (call once, typically at app startup)
  nfcService.enableReaderMode_ANDROID(
    NfcAdapter.FLAG_READER_NFC_V |
    NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS
  );

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

  // Enable Android reader mode (call once, typically at app startup)
  nfcService.enableReaderMode_ANDROID(NfcAdapter.FLAG_READER_NFC_V);

  const begin = () => {
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

## Technology Sessions (NfcTech.*)

Always use `NfcTech` enums.  
Do not pass raw strings.

```tsx
import { nfc } from "@spencerls/react-native-nfc";
import { useNfcTechnology } from "@spencerls/react-native-nfc";
import { NfcTech } from "react-native-nfc-manager";

export function ReadSystemInfo() {
  const { runWithTech } = useNfcTechnology();

  const readInfo = async () => {
    await runWithTech([NfcTech.NfcV], async () => {
      const info = await nfc.v.getSystemInfoNfcV();
      console.log(info);
    });
  };

  return <Button title="Read NFC-V Info" onPress={readInfo} />;
}
```

---

## NDEF Read/Write

```tsx
import { useNfcTechnology } from "@spencerls/react-native-nfc";
import { NfcTech, Ndef, NfcManager } from "react-native-nfc-manager";

export default function WriteScreen() {
  const { runWithTech } = useNfcTechnology();

  const writeHello = async () => {
    await runWithTech([NfcTech.Ndef], async () => {
      const bytes = Ndef.encodeMessage([
        Ndef.textRecord("Hello NFC!")
      ]);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);
    });
  };

  return <Button title="Write NDEF" onPress={writeHello} />;
}
```

---

## Namespace API

```ts
import { nfc } from "@spencerls/react-native-nfc";

await nfc.v.getSystemInfoNfcV();
await nfc.v.readSingleBlock(uid, 0);

await nfc.a.transceive(rawBytes);

await nfc.ndef.parse(ndefBytes);

nfc.service.startReader(...);
nfc.service.withTechnology(...);
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
