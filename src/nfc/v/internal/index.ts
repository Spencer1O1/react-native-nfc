import * as operations from "./operations";
import { tech } from "./tech";
import * as utils from "./utils";

export const nfcVTag = {
  ...operations,
  tech,
  utils,
} as const;
