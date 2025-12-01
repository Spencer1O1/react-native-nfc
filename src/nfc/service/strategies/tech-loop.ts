import { NfcPrimitives } from "../../primitives";
import type { NfcStateMachine } from "../state";
import { NfcState } from "../state/types";
import {
  type NfcStrategy,
} from "../strategies/types";

import { type Job, type TechLoopJob, JobType } from "../types";

export class TechLoopStrategy implements NfcStrategy {
  canHandle(job: Job): boolean {
    return job.type === JobType.TECH_LOOP;
  }

  async execute(
    job: TechLoopJob,
    stateMachine: NfcStateMachine,
  ): Promise<void> {
    const { tech, withTechnology, afterTechnology, options } = job;

    while (true) {
      if (stateMachine.getState() === NfcState.STOPPING) break;

      try {
        await NfcPrimitives.withTechnology(tech, withTechnology, options);
      } catch (e) {
        if (await handleStartTechError(e)) {
          continue;
        }
        break;
      }

      if (afterTechnology) {
        await afterTechnology();
      }
    }
  }
}

async function handleStartTechError(e: any): Promise<boolean> {
  if (e.message.includes("UserCancel")) {
    console.log("withTechnology() Cancelled");
    return true;
  }
  if (e.message === "Technology already started") {
    console.warn("withTechnology() Already started");
    await NfcPrimitives.stopTechnology();
    return true;
  }
  console.error("withTechnology() failed", e.message);
  return false;
}
