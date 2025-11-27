import type { NfcTech, TagEvent } from "react-native-nfc-manager";

import { nfcService } from "../service";
import { nfcTag } from "./internal";

export async function getTag(tech: NfcTech | NfcTech[]): Promise<TagEvent> {
  return nfcService.withTechnology(tech, nfcTag.getTag);
}
