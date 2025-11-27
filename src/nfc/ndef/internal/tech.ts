import { Platform } from "react-native";
import { NfcTech } from "react-native-nfc-manager";

export const tech =
  Platform.OS === "android" ? [NfcTech.Ndef, NfcTech.NfcA] : [NfcTech.Ndef];
