"use client";

// The product chrome: persistent sidebar (desktop) / bottom tabs (mobile) + a sticky
// topbar carrying the account this browser is using. Pages render inside.
import type { ReactNode } from "react";

import { useWallet } from "@/lib/hooks";
import { useCopy } from "@/lib/copy/context";
import LangSwitch from "../LangSwitch";
import { shortAddr } from "./format";

export type AppPage = "campaigns" | "new";

const APP_PAGES: AppPage[] = ["campaigns", "new"];
const ICON: Record<AppPage, string> = { campaigns: "◈", new: "+" };

export default function AppShell({
  page,
  onGo,
  children,
}: {
  page: string;
  onGo: (view: "landing" | AppPage) => void;
  children: ReactNode;
}) {
  const { address } = useWallet();
  const { shell } = useCopy();
  const label: Record<AppPage, string> = { campaigns: shell.campaigns, new: shell.create };

  return (
    <div className="shell">
      <aside className="shell__side">
        <button className="shell__brand" onClick={() => onGo("landing")} type="button">
          <span className="shell__glyph" /> Stello
        </button>
        <nav className="shell__nav">
          {APP_PAGES.map((p) => (
            <button
              key={p}
              className={`shell__item${page === p ? " is-active" : ""}`}
              onClick={() => onGo(p)}
              type="button"
            >
              <span className="shell__icon">{ICON[p]}</span> {label[p]}
            </button>
          ))}
        </nav>
        <div className="shell__foot">
          <div className="shell__testnet">{shell.testnet}</div>
          <a
            className="shell__docs"
            href="https://github.com/sayweer/stello#readme"
            target="_blank"
            rel="noreferrer"
          >
            {shell.docs}
          </a>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__top">
          {/* Left carries the language, so it is reachable from inside the app too. */}
          <LangSwitch className="shell__lang" />
          {address ? (
            <button className="anav__chip" onClick={() => onGo("campaigns")} type="button">
              <i className="anav__dot" /> {shortAddr(address)}
            </button>
          ) : (
            // The pill always points at the other door, never at the page you are on.
            <button
              className="anav__cta"
              onClick={() => onGo(page === "new" ? "campaigns" : "new")}
              type="button"
            >
              {page === "new" ? shell.campaigns : shell.create}
            </button>
          )}
        </header>
        <main className="shell__content">{children}</main>
      </div>

      <nav className="shell__tabs">
        {APP_PAGES.map((p) => (
          <button
            key={p}
            className={`shell__tab${page === p ? " is-active" : ""}`}
            onClick={() => onGo(p)}
            type="button"
          >
            <span className="shell__icon">{ICON[p]}</span>
            {label[p]}
          </button>
        ))}
      </nav>
    </div>
  );
}
