"use client";

import { otherLang } from "@/lib/copy";
import { useCopy, useLang } from "@/lib/copy/context";

/**
 * A real navigation rather than client state, so the language is in the URL and
 * a link opens in the language it was shared in. The hash is carried over so
 * switching from inside a campaign keeps you on that campaign.
 */
export default function LangSwitch({ className }: { className?: string }) {
  const lang = useLang();
  const { nav } = useCopy();
  const other = otherLang(lang);

  const go = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    window.location.href = `/${other}${window.location.hash}`;
  };

  return (
    <a
      className={className}
      href={`/${other}`}
      onClick={go}
      aria-label={nav.langLabel}
      lang={other}
    >
      {other.toUpperCase()}
    </a>
  );
}
