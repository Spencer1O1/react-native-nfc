import { useEffect, useState } from "react";

import { nfcService } from "../nfc";

export function useNfcState() {
  const [nfcState, setNfcState] = useState(nfcService.getState());

  useEffect(() => nfcService.subscribe(setNfcState), []);

  return nfcState;
}
