import type {
  NfcTech,
  RegisterTagEventOpts,
  TagEvent,
} from "react-native-nfc-manager";

export enum JobType {
  TECH = "tech",
  TAG_EVENT = "tag_event",
  TECH_LOOP = "tech_loop",
  TAG_EVENT_LOOP = "tag_event_loop",
}

export interface Job {
  type: JobType;
}

export interface TagEventJob extends Job {
  type: JobType.TAG_EVENT | JobType.TAG_EVENT_LOOP;
  onTag: (tag: TagEvent) => Promise<void>;
  options?: RegisterTagEventOpts;
}

export interface TagEventLoopJob extends TagEventJob {
  type: JobType.TAG_EVENT_LOOP;
  onTag: (tag: TagEvent) => Promise<void>;
  options?: RegisterTagEventOpts;
}

export interface TechJob extends Job {
  type: JobType.TECH;
  tech: NfcTech[];
  withTechnology: () => Promise<void>;
  afterTechnology?: () => Promise<void>;
  options?: RegisterTagEventOpts;
}

export interface TechLoopJob extends Job {
  type: JobType.TECH_LOOP;
  tech: NfcTech[];
  withTechnology: () => Promise<void>;
  afterTechnology?: () => Promise<void>;
  options?: RegisterTagEventOpts;
}
