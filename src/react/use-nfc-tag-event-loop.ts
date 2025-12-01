import { nfcService } from "../nfc/service";
import { useCallback, useEffect, useState } from "react";
import type { RegisterTagEventOpts, TagEvent } from "react-native-nfc-manager";

export function useNfcTagEventLoop(
  onTag: (tag: TagEvent) => Promise<void>,
  options?: RegisterTagEventOpts,
) {
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(async () => {
    await nfcService.startTagEventLoop(onTag, options);
    setIsRunning(true);
  }, [onTag, options]);

  const stop = useCallback(async () => {
    await nfcService.stop();
    setIsRunning(false);
  }, []);

  useEffect(() => {
    return () => {
      nfcService.stop(); // Graceful unmount...
    };
  }, []);

  return { start, stop, isRunning };
}
