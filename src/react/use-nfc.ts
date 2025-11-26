import { useEffect } from "react";
import type { TagEvent } from "react-native-nfc-manager";

import { nfcService } from "../nfc/service";

export function useNfc(
  onTag: (tagId: string) => void,
  options: { cooldownMs?: number },
) {
  useEffect(() => {
    nfcService.startReader(
      async (tag: TagEvent) => {
        if (!tag.id) return;
        onTag(tag.id);
      },
      { cooldownMs: options?.cooldownMs },
    );

    return () => {
      nfcService.stopReader();
    };
  }, [onTag]);
}
