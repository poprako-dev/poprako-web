export function isKeyboardComposing(event: Pick<KeyboardEvent, "isComposing" | "keyCode">) {
  // Some IMEs report the confirming key with isComposing=false and keyCode=229.
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- IME compatibility fallback.
  return event.isComposing || event.keyCode === 229;
}
