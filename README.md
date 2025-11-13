# @spencer/nfc

An easy, clean, React-friendly NFC service built on `react-native-nfc-manager`.

## Installation

```bash
npm install @spencer/nfc
# or
yarn add @spencer/nfc
```

## Requires:

`react-native-nfc-manager`

React Native 0.74+ or Expo (Bare / Prebuild)

## Usage

```tsx
import { nfc } from "@spencer/nfc";
import { Ndef, NfcAdapter } from "react-native-nfc-manager";

export default function Example() {
  const { nfcState } = useNfc();

  useEffect(() => {
    nfc.service.startReader(
      NfcAdapter.FLAG_READER_NFC_V | NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS,
      async (tag) => {
        console.log("Tag:", tag);
        await nfc.service.stopReader();
        await nfc.service.writeNdef([Ndef.textRecord("Hello NFC!")]);
      }
    );

    return () => nfc.service.stopReader();
  }, []);

  return <Text>NFC state: {nfcState}</Text>;
}
```

## License

MIT © Spencer Smith
