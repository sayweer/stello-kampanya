"use client";

// The product chrome: persistent sidebar (desktop) / bottom tabs (mobile) + a sticky
// topbar carrying the account this browser is using. Pages render inside.
import type { ReactNode } from "react";

import { useWallet } from "@/lib/hooks";
import { shortAddr } from "./format";

export type AppPage = "campaigns" | "new";

const NAV: Record<AppPage, { label: string; icon: string }> = {
  campaigns: { label: "Kampanyalar", icon: "◈" },
  new: { label: "Kampanya aç", icon: "+" },
};
const APP_PAGES: AppPage[] = ["campaigns", "new"];

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
              <span className="shell__icon">{NAV[p].icon}</span> {NAV[p].label}
            </button>
          ))}
        </nav>
        <div className="shell__foot">
          <div className="shell__testnet">⚠ Test ağı — test parası, gerçek para değil.</div>
          <a
            className="shell__docs"
            href="https://github.com/sayweer/stello#readme"
            target="_blank"
            rel="noreferrer"
          >
            Nasıl çalışıyor ↗
          </a>
        </div>
      </aside>

      <div className="shell__main">
        <header className="shell__top">
          {/* Left stays empty until there is something to switch between, as in the reference. */}
          <span />
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
              {page === "new" ? "Kampanyalar" : "Kampanya aç"}
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
            <span className="shell__icon">{NAV[p].icon}</span>
            {NAV[p].label}
          </button>
        ))}
      </nav>
    </div>
  );
}
