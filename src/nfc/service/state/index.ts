import { NfcState } from "../state/types";
import type { NfcStrategy } from "../strategies/types";
import { type Job } from "../types";

export class NfcStateMachine {
  private state: NfcState = NfcState.IDLE;
  private currentJob: Job | null = null;

  async transition(to: NfcState, strategy: NfcStrategy): Promise<void> {
    if (!this.currentJob) {
      throw new Error("No current job");
    }
    if (!strategy.canHandle(this.currentJob)) {
      throw new Error(
        `Strategy ${strategy.constructor.name} cannot handle ${this.currentJob.type}`,
      );
    }

    console.log(`🔄 ${this.state} → ${to}`);
    this.state = to;
  }

  getState() {
    return this.state;
  }

  setCurrentJob(job: Job): void {
    this.currentJob = job;
  }

  async transitionToIdle(): Promise<void> {
    console.log("🔄 Transitioning to idle");
    this.state = NfcState.IDLE;
    this.currentJob = null;
  }

  async stop(): Promise<void> {
    if (this.state === NfcState.IDLE) return;
    if (!this.isLoopingState()) return;
    console.log("🔄 Transitioning to stopping");
    this.state = NfcState.STOPPING;
  }

  private isLoopingState(): boolean {
    return [NfcState.TECH_LOOP, NfcState.TAG_EVENT_LOOP].includes(this.state);
  }
}
