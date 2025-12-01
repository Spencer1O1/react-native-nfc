import { NfcPrimitives } from "../../primitives";
import type { NfcStateMachine } from "../state";
import {
  type NfcStrategy,
} from "../strategies/types";

import { type Job, type TechJob, JobType } from "../types";

export class TechStrategy implements NfcStrategy {
  canHandle(job: Job): boolean {
    return job.type === JobType.TECH;
  }

  async execute(job: Job, stateMachine: NfcStateMachine): Promise<void> {
    const { tech, withTechnology, afterTechnology, options } = job as TechJob;
    await NfcPrimitives.withTechnology(tech, withTechnology, options);
    if (afterTechnology) {
      await afterTechnology();
    }
  }
}
