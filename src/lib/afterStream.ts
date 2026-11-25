import { startTransition } from "react";

/**
 * Runs `update` (as a transition) once this page's streamed content is in place.
 *
 * Why: every page sits inside a Suspense boundary (the root loading.tsx) and usually streams
 * in after the shell, as a hidden `<div id="S:n">` that React then swaps in. React 19 queues
 * that swap: it can happen tens of milliseconds after the document has finished loading, and
 * after hydration has started. If a context above the boundary changes in that window (the
 * session or the saved cart arriving), React client-renders the boundary itself, and when the
 * queued swap runs there is nothing left to swap into, so the streamed copy stays in the page,
 * hidden: a second copy of the page with the same ids (duplicate forms and rows).
 *
 * So this waits for the document to finish parsing and for every streamed segment to be
 * swapped in (no hidden `S:` element left). It never waits more than `maxWaitMs`, so an update
 * can't be held back for good.
 */
const pendingSegment = () => document.querySelector('[id^="S:"][hidden]') !== null;

export function afterStream(update: () => void, maxWaitMs = 2000) {
  const run = () => startTransition(update);
  if (typeof document === "undefined") return run();

  const whenSwapped = () => {
    if (!pendingSegment()) return run();
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      observer.disconnect();
      clearTimeout(timer);
      run();
    };
    const observer = new MutationObserver(() => !pendingSegment() && finish());
    observer.observe(document.body, { childList: true, subtree: true });
    const timer = setTimeout(finish, maxWaitMs);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", whenSwapped, { once: true });
  else whenSwapped();
}
