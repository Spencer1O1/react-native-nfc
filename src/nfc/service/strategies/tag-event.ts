import { NfcPrimitives } from "../../primitives";
import type { NfcStateMachine } from "../state";
import { NfcStrategyError } from "../strategies/error";
import { NfcEvents, type TagEvent } from "react-native-nfc-manager";

import {
  type NfcStrategy,
} from "../strategies/types";

import { type Job, type TagEventJob, JobType } from "../types";

export class TagEventStrategy implements NfcStrategy {
  canHandle(job: Job): boolean {
    return job.type === JobType.TAG_EVENT;
  }

  async execute(
    job: TagEventJob,
    stateMachine: NfcStateMachine,
  ): Promise<void> {
    const { onTag, options } = job;

    NfcPrimitives.setEventListener(NfcEvents.DiscoverTag, null);

    try {
      await NfcPrimitives.registerTagEvent(options);
    } catch (err: any) {
      NfcPrimitives.setEventListener(NfcEvents.DiscoverTag, null);
      throw new NfcStrategyError(
        `TagEvent registration failed: ${err.message}`,
        this.constructor.name,
      );
    }

    return new Promise<void>((resolve, reject) => {
      let done = false;

      const handler = async (tag: TagEvent) => {
        if (done) return;
        done = true;

        try {
          await onTag(tag);
          resolve();
        } catch (err: any) {
          reject(
            new NfcStrategyError(
              `Tag processing failed: ${err.message}`,
              this.constructor.name,
            ),
          );
        } finally {
          NfcPrimitives.setEventListener(NfcEvents.DiscoverTag, null);
          try {
            await NfcPrimitives.unregisterTagEvent();
          } catch {}
        }
      };

      NfcPrimitives.setEventListener(NfcEvents.DiscoverTag, handler);
    });
  }
}
