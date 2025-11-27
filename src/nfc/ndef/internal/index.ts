import * as operations from "./operations";
import { tech } from "./tech";

export const nfcNdefTag = {
  ...operations,
  tech,
} as const;
