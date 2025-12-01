import { useCallback } from "react";
import type { NfcTech, RegisterTagEventOpts } from "react-native-nfc-manager";

import { nfcService } from "../nfc/service";

export function useNfcTech(
  tech: NfcTech[],
  withTechnology: () => Promise<void>,
  afterTechnology?: () => Promise<void>,
  options?: RegisterTagEventOpts,
) {
  const startTech = useCallback(() => {
    nfcService
      .startTech(tech, withTechnology, afterTechnology, options || {})
      .catch(console.error);
  }, [tech, withTechnology, afterTechnology, options]);

  return { startTech };
}
