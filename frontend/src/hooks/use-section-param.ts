import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps the active dashboard section in the URL (?tab=...) so sections are
 * deep-linkable and the browser back button moves between them.
 */
export function useSectionParam<T extends string>(sections: readonly T[], fallback: T) {
  const [params, setParams] = useSearchParams();
  const raw = params.get("tab");
  const active = (sections as readonly string[]).includes(raw ?? "") ? (raw as T) : fallback;

  const setActive = useCallback(
    (next: T) => {
      setParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === fallback) p.delete("tab");
          else p.set("tab", next);
          return p;
        },
        { replace: false }
      );
    },
    [setParams, fallback]
  );

  return [active, setActive] as const;
}
