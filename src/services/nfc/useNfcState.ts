import { useEffect, useState } from "react";
import { nfcService, NfcState } from "./NfcService";

export function useNfcState() {
  const [state, setState] = useState<NfcState>(nfcService.getState());

  useEffect(() => nfcService.subscribe(setState), []);

  return {
    state,
    lastTag: nfcService.getLastTag(),
  };
}
