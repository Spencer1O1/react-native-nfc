import { useEffect, useState } from "react";
import { nfcService } from "..";

export function useNfc() {
  const [nfcState, setNfcState] = useState(nfcService.getState());

  useEffect(() => nfcService.subscribe(setNfcState), []);

  return nfcState;
}
