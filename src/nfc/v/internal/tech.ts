import { Platform } from "react-native";
import { NfcTech } from "react-native-nfc-manager";

export const tech =
  Platform.OS === "ios" ? [NfcTech.Iso15693IOS] : NfcTech.NfcV;
