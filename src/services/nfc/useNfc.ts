import { useEffect, useState } from "react";
import { nfcService, NfcState } from "./NfcService";

export function useNfc() {
  const [nfc, setNfc] = useState<NfcState>(nfcService.getState());

  useEffect(() => nfcService.subscribe(setNfc), []);

  return nfc;
}
