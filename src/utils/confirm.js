export function confirmDestructiveAction(message, confirmFn = globalThis.window?.confirm?.bind(globalThis.window)) {
  if (!confirmFn) return false;
  return Boolean(confirmFn(message));
}
