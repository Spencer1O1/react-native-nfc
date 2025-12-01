import { NfcPrimitives } from "../../primitives";
import type { NfcStateMachine } from "../state";
import { NfcState } from "../state/types";
import { NfcStrategyError } from "../strategies/error";
import { NfcEvents, type TagEvent } from "react-native-nfc-manager";

import {
  type NfcStrategy,
} from "../strategies/types";

import { type Job, type TagEventLoopJob, JobType } from "../types";

export class TagEventLoopStrategy implements NfcStrategy {
  canHandle(job: Job): boolean {
    return job.type === JobType.TAG_EVENT_LOOP;
  }

  async execute(
    job: TagEventLoopJob,
    stateMachine: NfcStateMachine,
  ): Promise<void> {
    const { onTag, options } = job;

    let isProcessingTag = false;
    let cooldownTimer: ReturnType<typeof setTimeout> | undefined;

    const handleTagEvent = async (tag: TagEvent) => {
      if (!tag || isProcessingTag) return;

      isProcessingTag = true;
      try {
        await onTag(tag);
      } catch (err: any) {
        console.warn("[NFC] Tag processing failed:", err);
      } finally {
        isProcessingTag = false;
      }
    };

    NfcPrimitives.setEventListener(NfcEvents.DiscoverTag, handleTagEvent);

    try {
      await NfcPrimitives.registerTagEvent(options);

      // INDUSTRY STANDARD: 100ms state poll
      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (stateMachine.getState() === NfcState.STOPPING) {
            clearInterval(interval);
            resolve();
          }
        }, 100);
      });
    } catch (err: any) {
      throw new NfcStrategyError(
        `TagEvent loop failed: ${err.message}`,
        this.constructor.name,
      );
    } finally {
      NfcPrimitives.setEventListener(NfcEvents.DiscoverTag, null);
      await NfcPrimitives.unregisterTagEvent().catch(() => {});
      if (cooldownTimer) clearTimeout(cooldownTimer);
    }
  }
}
