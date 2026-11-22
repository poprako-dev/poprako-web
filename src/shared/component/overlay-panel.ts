/**
 * Shared constraints for scrim-centered overlays.
 *
 * Mirrors the layout contract already implemented by `AppDialog`: the overlay
 * scrim owns the `p-4` viewport inset, and the panel must stay inside
 * `100dvh - 2rem` with a scrollable body.
 */
export const overlayPanelClass = "relative flex max-h-[calc(100dvh-2rem)] flex-col";

export const overlayScrollBodyClass = "min-h-0 flex-1 overflow-y-auto";
