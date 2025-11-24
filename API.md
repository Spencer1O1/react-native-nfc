# @spencerls/react-native-nfc – API Reference

This document describes the complete public API surface of the NFC package.

All exports come from:

```ts
import { nfc, nfcService } from "@spencerls/react-native-nfc";
import {
  useNfc,
  useNfcState,
  useNfcReader,
  useNfcTechnology,
  NfcProvider
} from "@spencerls/react-native-nfc";
```

---

# Core Service: `nfcService`

```ts
import { nfcService } from "@spencerls/react-native-nfc";
```

### Methods

#### startReader(flags, onTag, options?)
Starts platform reader mode.

```ts
nfcService.startReader(
  flags: number,
  onTag: (tag: TagEvent) => void,
  options?: { cooldownMs?: number }
)
```

#### stopReader()
Stops reader mode.

```ts
await nfcService.stopReader();
```

#### withTechnology(tech, handler)
Opens an iOS/Android technology session. Stops reader mode before starting.

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

`nfc` is a namespaced, easy-to-use interface:

```
nfc.service        (NfcService instance)
nfc.v.*            NFC-V operations
nfc.a.*            NFC-A operations
nfc.ndef.*         NDEF operations
```

---

# NFC-V Namespace: `nfc.v`

High-level ISO15693 helpers and raw operations.

```ts
nfc.v.getSystemInfoNfcV()
nfc.v.readSingleBlock(uid, blockNumber)
nfc.v.readMultipleBlocks(uid, start, count)
nfc.v.writeSingleBlock(uid, blockNumber, data)
nfc.v.getSecurityStatus(uid, blockNumber)
```

---

# NFC-A Namespace: `nfc.a`

```ts
nfc.a.transceive(bytes)
nfc.a.getAtqa()
nfc.a.getSak()
```

---

# NDEF Namespace: `nfc.ndef`

```ts
nfc.ndef.parse(bytes)
nfc.ndef.encode(records)
nfc.ndef.utils.*
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

```ts
useNfc(
  (tagId: string) => { ... },
  {
    flags?: number,
    cooldownMs?: number
  }
);
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

```ts
const { start, stop } = useNfcReader();
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

# NfcProvider

Optional provider that exposes service state to React tree.

```tsx
<NfcProvider>
  <App />
</NfcProvider>
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

# Internal Notes

- iOS automatically restarts reader mode after each scan.
- Android waits for cooldown before accepting next scan.
- Technology sessions interrupt reader mode safely.
- `NfcTech` enums must be used. Do not pass raw strings.

---

# License

MIT © Spencer Smith
