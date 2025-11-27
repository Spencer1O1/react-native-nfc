export class NfcError extends Error {
  constructor(message: string) {
    super(`[NFC] ${message}`);
  }
}
