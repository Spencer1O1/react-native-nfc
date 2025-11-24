import { useEffect } from "react";

import { nfcService } from "../nfc/service";

export function useNfc(
  onTag: (tagId: string) => void,
  options: { cooldownMs?: number; flags: number },
) {
  useEffect(() => {
    const flags = options.flags;

    nfcService.startReader(
      flags,
      async (tag) => {
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
