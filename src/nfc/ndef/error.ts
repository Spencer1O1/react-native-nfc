export class NdefError extends Error {
  constructor(message: string) {
    super(`[NDEF] ${message}`);
  }
}
