import { useCallback } from "react";
import type { TagEvent } from "react-native-nfc-manager";

import { nfcService } from "../nfc/service";

export function useNfcReader() {
  const start = useCallback(
    (
      flags: number, 
      onTag?: (tag: TagEvent) => Promise<void> | void, 
      cooldownMs?: number) => {
      nfcService.startReader(flags, onTag, { cooldownMs });
    },
    [],
  );

  const stop = useCallback(() => {
    nfcService.stopReader();
  }, []);

  return { start, stop };
}
