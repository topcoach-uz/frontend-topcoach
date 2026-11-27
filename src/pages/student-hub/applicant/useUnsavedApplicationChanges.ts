import { useContext, useEffect, useRef } from "react";
import { UNSAFE_NavigationContext, useLocation } from "react-router-dom";

/** Scoped to application forms; covers router actions, links, reload and history traversal. */
export function useUnsavedApplicationChanges(dirty: boolean) {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const location = useLocation();
  const dirtyRef = useRef(dirty);
  const historyIndex = useRef<number | undefined>(window.history.state?.idx);
  dirtyRef.current = dirty;
  const canLeave = () => {
    if (!dirtyRef.current || window.confirm("Discard your unsaved changes?")) {
      dirtyRef.current = false;
      return true;
    }
    return false;
  };
  useEffect(() => {
    historyIndex.current = window.history.state?.idx;
  }, [location.key]);
  useEffect(() => {
    const push = navigator.push;
    const replace = navigator.replace;
    const guardedPush: typeof push = (...args) => {
      if (canLeave()) push.apply(navigator, args);
    };
    const guardedReplace: typeof replace = (...args) => {
      if (canLeave()) replace.apply(navigator, args);
    };
    navigator.push = guardedPush;
    navigator.replace = guardedReplace;
    let restoring = false;
    const pop = (event: PopStateEvent) => {
      const next: number | undefined = event.state?.idx;
      const previous = historyIndex.current;
      if (restoring) {
        restoring = false;
        historyIndex.current = next;
        return;
      }
      if (
        previous !== undefined &&
        next !== undefined &&
        previous !== next &&
        !canLeave()
      ) {
        event.stopImmediatePropagation();
        restoring = true;
        window.history.go(previous - next);
        return;
      }
      historyIndex.current = next;
    };
    const unload = (event: BeforeUnloadEvent) => {
      if (dirtyRef.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const click = (event: MouseEvent) => {
      const anchor = (event.target as Element)?.closest?.(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (
        !dirtyRef.current ||
        !anchor ||
        anchor.target === "_blank" ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0 ||
        anchor.href === window.location.href ||
        anchor.getAttribute("href")?.startsWith("#")
      )
        return;
      if (!canLeave()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("popstate", pop, true);
    document.addEventListener("click", click, true);
    return () => {
      if (navigator.push === guardedPush) navigator.push = push;
      if (navigator.replace === guardedReplace) navigator.replace = replace;
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("popstate", pop, true);
      document.removeEventListener("click", click, true);
    };
  }, [navigator]);
  return {
    canLeave,
    markSaved: () => {
      dirtyRef.current = false;
    },
  };
}
