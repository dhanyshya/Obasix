import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and while React is hydrating, true once the page is interactive.
 * Use it to keep a control disabled until its handlers are attached: a form submitted before
 * hydration is sent by the browser itself, which reloads the page and wipes what was typed.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
