export const FIRST_REGISTRATION_FLAG_KEY = "poprako:first-registration";

type ReadableStorage = Pick<Storage, "getItem">;
type WritableStorage = Pick<Storage, "setItem">;

export function readFirstRegistrationFlag(storage: ReadableStorage = localStorage): boolean {
  try {
    return storage.getItem(FIRST_REGISTRATION_FLAG_KEY) === "true";
  } catch (error) {
    console.error("[FirstRegistrationGuide] 读取注册引导状态失败：", error);
    return false;
  }
}

export function writeFirstRegistrationFlag(
  isValue: boolean,
  storage: WritableStorage = localStorage,
): void {
  try {
    storage.setItem(FIRST_REGISTRATION_FLAG_KEY, String(isValue));
  } catch (error) {
    console.error("[FirstRegistrationGuide] 保存注册引导状态失败：", error);
  }
}
