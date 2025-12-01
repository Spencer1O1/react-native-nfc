import type { NfcStateMachine } from "../state";
import type { Job } from "../types";

export interface NfcStrategy {
  execute(job: Job, stateMachine: NfcStateMachine): Promise<void>;
  canHandle(job: Job): boolean;
}
