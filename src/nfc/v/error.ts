export class VError extends Error {
  constructor(message: string) {
    super(`[V] ${message}`);
  }
}
