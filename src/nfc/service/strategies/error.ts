import { NfcError } from "../../error";

export class NfcStrategyError extends NfcError {
  constructor(message: string, strategy: string) {
    super(`[${strategy}] ${message}`);
  }
}
