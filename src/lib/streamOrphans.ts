/**
 * Removes streamed page content that React will never swap in.
 *
 * Every page sits inside a Suspense boundary (the root loading.tsx) and usually streams in after
 * the shell: a hidden `<div id="S:n">` with the content, plus a marker `<template id="B:n">` where
 * it belongs. React 19 queues that swap. If a context above the boundary changes before the swap
 * (the session or saved cart arriving), React renders the boundary on the client and drops the
 * marker, and the queued swap then has nowhere to go: the hidden copy stays in the page with the
 * same ids as the live one (duplicate forms, rows and order ids for assistive tech and tests).
 *
 * A hidden segment whose marker is gone is such a copy. It is outside React's tree, so removing
 * it is safe. Segments that are still pending (marker present) are left alone.
 */
export function removeOrphanedSegments() {
  for (const segment of Array.from(document.querySelectorAll<HTMLElement>('[id^="S:"][hidden]'))) {
    if (!document.getElementById(`B:${segment.id.slice(2)}`)) segment.remove();
  }
}

/** Watches until a little after the page has loaded; streamed segments only arrive while it loads. */
export function watchOrphanedSegments(afterLoadMs = 10_000) {
  removeOrphanedSegments();
  const observer = new MutationObserver(removeOrphanedSegments);
  observer.observe(document.body, { childList: true, subtree: true });
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stopLater = () => (timer = setTimeout(() => observer.disconnect(), afterLoadMs));
  if (document.readyState === "complete") stopLater();
  else window.addEventListener("load", stopLater, { once: true });
  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
    window.removeEventListener("load", stopLater);
  };
}
