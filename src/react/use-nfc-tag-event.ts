import { nfcService } from "../nfc/service";
import { useCallback } from "react";
import type { TagEvent } from "react-native-nfc-manager";

export function useNfcTagEvent(onTag: (tag: TagEvent) => Promise<void>) {
  const startTech = useCallback(() => {
    nfcService.startTagEvent(onTag).catch(console.error);
  }, [onTag]);

  return { startTech };
}
