"use client";

import { createContext, useContext, type ReactNode } from "react";
import { getCopy, type Copy, type Lang } from "./index";

/**
 * The app is one client-rendered document with hash routing, so the language
 * cannot be passed down as props without threading it through every panel.
 * It is fixed for the lifetime of the page — the toggle is a real navigation —
 * so a context read costs nothing and never re-renders the tree.
 */
const Ctx = createContext<{ lang: Lang; c: Copy } | null>(null);

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <Ctx.Provider value={{ lang, c: getCopy(lang) }}>{children}</Ctx.Provider>;
}

function useCtx() {
  const value = useContext(Ctx);
  if (!value) throw new Error("useCopy must be used inside LangProvider");
  return value;
}

/** The strings. */
export function useCopy(): Copy {
  return useCtx().c;
}

/** The current language, for links and locale-aware formatting. */
export function useLang(): Lang {
  return useCtx().lang;
}
