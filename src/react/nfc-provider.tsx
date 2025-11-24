import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { nfcService } from "../nfc/service";
import type { NfcState } from "../nfc/types";

interface NfcContextValue {
  state: NfcState;
  service: typeof nfcService;
}

const NfcContext = createContext<NfcContextValue | null>(null);

export function NfcProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState(nfcService.getState());

  useEffect(() => {
    const unsubscribe = nfcService.subscribe(setState);
    return unsubscribe;
  }, []);

  return (
    <NfcContext.Provider value={{ state, service: nfcService }}>
      {children}
    </NfcContext.Provider>
  );
}

export function useNfcContext() {
  const ctx = useContext(NfcContext);
  if (!ctx) throw new Error("useNfcContext must be inside <NfcProvider>");
  return ctx;
}
