# @spencer/nfc

A clean, easy, React-friendly NFC service built on `react-native-nfc-manager`.

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
import { nfcService, useNfcState, NfcUtils } from "@spencer/nfc";

export default function Example() {
  const { state, isWriting } = useNfcState();

  useEffect(() => {
    nfcService.startReader(
      NfcAdapter.FLAG_READER_NFC_V | NfcAdapter.FLAG_READER_NO_PLATFORM_SOUNDS,
      async (tag) => {
        console.log("Tag:", tag);
        await nfcService.stopReader();
        await nfcService.writeNdef([NfcUtils.textRecord("Hello NFC!")]);
      }
    );

    return () => nfcService.stopReader();
  }, []);

  return <Text>NFC state: {state}</Text>;
}
```

## License

MIT © Spencer Smith
