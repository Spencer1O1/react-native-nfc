import { useCallback, useEffect, useState } from "react";
import type { NfcTech, RegisterTagEventOpts } from "react-native-nfc-manager";

import { nfcService } from "../nfc/service";

export function useNfcTechLoop(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts,
) {
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(async () => {
    await nfcService.startTechLoop(
      tech,
      withTechnology,
      afterTechnology,
      options || {},
    );
    setIsRunning(true);
  }, [tech, withTechnology, afterTechnology, options]);

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
