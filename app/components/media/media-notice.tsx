"use client";

import { useMedia } from "./media-context";

export function MediaNotice() {
  const { notice } = useMedia();
  if (!notice) return null;

  return (
    <p
      role="status"
      className="fixed bottom-20 left-1/2 z-30 max-w-md -translate-x-1/2 rounded-lg border border-line bg-panel px-4 py-2 text-xs text-ink shadow-2xl"
    >
      {notice}
    </p>
  );
}
