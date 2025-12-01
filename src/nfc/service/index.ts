import type {
  NfcTech,
  RegisterTagEventOpts,
  TagEvent,
} from "react-native-nfc-manager";

import { NfcStateMachine } from "./state";
import { NfcState } from "./state/types";
import { TagEventStrategy } from "./strategies/tag-event";
import { TagEventLoopStrategy } from "./strategies/tag-event-loop";
import { TechStrategy } from "./strategies/tech";
import { TechLoopStrategy } from "./strategies/tech-loop";
import type { NfcStrategy } from "./strategies/types";
import {
  type Job,
  JobType,
  type TagEventJob,
  type TagEventLoopJob,
  type TechJob,
  type TechLoopJob,
} from "./types";

export class NfcService {
  private static instance: NfcService;

  private strategies: NfcStrategy[] = [
    new TagEventStrategy(),
    new TagEventLoopStrategy(),
    new TechStrategy(),
    new TechLoopStrategy(),
  ];

  private stateMachine = new NfcStateMachine();
  private jobRetry: Job | null = null;
  private isExecutingJobs = false;

  static getInstance(): NfcService {
    if (!NfcService.instance) NfcService.instance = new NfcService();
    return NfcService.instance;
  }

  async startTech(
    tech: NfcTech[],
    withTechnology: () => Promise<void>,
    afterTechnology?: () => Promise<void>,
    options?: RegisterTagEventOpts,
  ) {
    const job: TechJob = {
      type: JobType.TECH,
      tech,
      withTechnology,
      afterTechnology,
      options,
    };
    await this.executeOrQueue(job);
  }

  async startTechLoop(
    tech: NfcTech[],
    withTechnology: () => Promise<void>,
    afterTechnology?: () => Promise<void>,
    options?: RegisterTagEventOpts,
  ): Promise<void> {
    const job: TechLoopJob = {
      type: JobType.TECH_LOOP,
      tech,
      withTechnology,
      afterTechnology,
      options,
    };
    this.executeOrQueue(job);
  }

  async startTagEvent(onTag: (tag: TagEvent) => Promise<void>) {
    const job: TagEventJob = {
      type: JobType.TAG_EVENT,
      onTag,
    };
    await this.executeOrQueue(job);
  }

  async startTagEventLoop(
    onTag: (tag: TagEvent) => Promise<void>,
    options?: RegisterTagEventOpts,
  ) {
    const job: TagEventLoopJob = {
      type: JobType.TAG_EVENT_LOOP,
      onTag,
      options,
    };
    await this.executeOrQueue(job);
  }

  async stop(): Promise<void> {
    console.log("🛑 Stopping NFC");
    this.jobRetry = null;
    await this.stateMachine.stop();
  }

  private async executeOrQueue(job: Job): Promise<void> {
    const state = this.stateMachine.getState();

    if (state === NfcState.STOPPING) {
      console.log("🔄 Setting retry job:", job.type);
      this.jobRetry = job;
      return;
    }
    await this.executeJob(job);
  }

  private async executeJob(job: Job): Promise<void> {
    if (this.isExecutingJobs) return;
    this.isExecutingJobs = true;

    let _nextJob: Job | null = job;
    while (_nextJob) {
      const strategy = this.strategies.find((s) => s.canHandle(job));
      if (!strategy) throw new Error(`No strategy for ${job.type}`);

      this.stateMachine.setCurrentJob(job);

      try {
        const targetState = mapJobTypeToState(job.type);
        await this.stateMachine.transition(targetState, strategy);

        console.log(`🚀 Starting ${job.type} via ${strategy.constructor.name}`);
        await strategy.execute(job, this.stateMachine);
        console.log(`✅ Completed ${job.type}`);
      } catch (error: any) {
        console.error(`❌ ${job.type} failed:`, error); //reload
        throw error;
      } finally {
        await this.stateMachine.transitionToIdle();

        if (this.jobRetry) {
          console.log("🔄 Retrying job:", this.jobRetry.type);
        }
        _nextJob = this.jobRetry;
      }
    }
    this.isExecutingJobs = false;
  }
}

function mapJobTypeToState(type: JobType): NfcState {
  switch (type) {
    case JobType.TECH:
      return NfcState.TECH;
    case JobType.TECH_LOOP:
      return NfcState.TECH_LOOP;
    case JobType.TAG_EVENT:
      return NfcState.TAG_EVENT;
    case JobType.TAG_EVENT_LOOP:
      return NfcState.TAG_EVENT_LOOP;
  }
}

export const nfcService = NfcService.getInstance();
