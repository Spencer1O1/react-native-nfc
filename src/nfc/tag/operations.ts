import type { NfcTech, TagEvent } from "react-native-nfc-manager";

import { nfcTag } from "./internal";
import { NfcPrimitives } from "../primitives";

export async function getTag(tech: NfcTech[]): Promise<TagEvent> {
  return NfcPrimitives.withTechnology(tech, nfcTag.getTag);
}
