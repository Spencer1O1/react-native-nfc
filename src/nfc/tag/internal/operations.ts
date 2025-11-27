import nfcManager from "react-native-nfc-manager";

export async function getTag() {
  const tagEvent = await nfcManager.getTag();
  if (!tagEvent) throw new Error("No tag detected");
  return tagEvent;
}
