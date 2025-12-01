import nfcManager, {
  type NfcEvents,
  type NfcTech,
  type OnNfcEvents,
  type RegisterTagEventOpts,
} from "react-native-nfc-manager";

export class NfcPrimitives {
  private static isRequestingTechnology = false;
  private static isCancellingTechnology = false;

  static async cleanTechnology(): Promise<void> {
    await NfcPrimitives.stopTechnology();
    NfcPrimitives.isCancellingTechnology = false;
  }

  static async startTechnology(
    tech: NfcTech[],
    options?: RegisterTagEventOpts,
  ): Promise<void> {
    if (NfcPrimitives.isRequestingTechnology) {
      throw new Error("Technology already started");
    }
    NfcPrimitives.isRequestingTechnology = true;

    try {
      console.log("Technology started");
      await nfcManager.requestTechnology(tech, options);
    } finally {
      NfcPrimitives.isRequestingTechnology = false;
    }
  }

  static async stopTechnology(): Promise<void> {
    if (NfcPrimitives.isCancellingTechnology) return;
    NfcPrimitives.isCancellingTechnology = true;
    try {
      await nfcManager.cancelTechnologyRequest();
      console.log("Technology stopped");
    } catch (_e) {
    } finally {
      NfcPrimitives.isCancellingTechnology = false;
    }
  }

  static async withTechnology<T>(
    tech: NfcTech[],
    callback: () => Promise<T>,
    options?: RegisterTagEventOpts,
  ): Promise<T> {
    let res: T | undefined;
    try {
      await NfcPrimitives.startTechnology(tech, options);
      res = await callback();
    } finally {
      await NfcPrimitives.stopTechnology();
    }
    return res;
  }

  static async getTag(): Promise<any> {
    return await nfcManager.getTag();
  }

  static async registerTagEvent(options?: RegisterTagEventOpts): Promise<void> {
    await nfcManager.registerTagEvent(options);
  }

  static async unregisterTagEvent(): Promise<void> {
    await nfcManager.unregisterTagEvent();
  }

  static setEventListener(event: NfcEvents, handler: OnNfcEvents | null): void {
    nfcManager.setEventListener(event, handler);
  }
}
