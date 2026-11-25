import { startTransition } from "react";

/**
 * Runs `update` (as a transition) once none of this page's streamed content is still waiting
 * to be swapped in.
 *
 * Why: every page sits inside a Suspense boundary (the root loading.tsx) and usually streams in
 * after the shell: the server sends the content as a hidden `<div id="S:n">` plus a marker
 * `<template id="B:n">` where it belongs, and React swaps one into the other. React 19 queues
 * that swap, and on a slow device or dev server it can come long after hydration has started.
 * If a context above the boundary changes while a segment is still pending (the session or the
 * saved cart arriving), React renders the boundary on the client instead: anything typed so far
 * is reset, and the queued swap later finds no marker, so the streamed copy stays in the page,
 * hidden, with the same ids as the live one (duplicate forms and rows).
 *
 * So the update waits while a segment is truly pending (its `S:n` and `B:n` both exist). A
 * segment whose marker is already gone will never be swapped in: it is a stale copy outside
 * React's tree, and is removed. `safetyMs` only guarantees an update is never held forever.
 */
function pendingSegments() {
  let pending = false;
  for (const segment of Array.from(document.querySelectorAll<HTMLElement>('[id^="S:"][hidden]'))) {
    if (document.getElementById(`B:${segment.id.slice(2)}`)) pending = true;
    else segment.remove(); // orphaned: its boundary was rendered on the client
  }
  return pending;
}

export function afterStream(update: () => void, safetyMs = 10_000) {
  const run = () => startTransition(update);
  if (typeof document === "undefined") return run();

  const whenSwapped = () => {
    if (!pendingSegments()) return run();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      clearTimeout(timer);
      run();
    };
    const observer = new MutationObserver(() => !pendingSegments() && finish());
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(finish, safetyMs);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", whenSwapped, { once: true });
  else whenSwapped();
}
