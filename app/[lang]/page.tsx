"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import Landing from "@/components/Landing";
import CampaignPage from "@/components/pages/CampaignPage";
import CampaignsPage from "@/components/pages/CampaignsPage";
import NewCampaignPage from "@/components/pages/NewCampaignPage";
import AppShell from "@/components/shell/AppShell";

type View =
  | { name: "landing" }
  | { name: "campaigns" }
  | { name: "new" }
  | { name: "campaign"; id: bigint };

/** Landing sections are anchors, not routes — they must not tear the scene down. */
const LANDING_ANCHORS = new Set(["proof", "how", "guarantees", "privacy"]);

function viewFromHash(hash: string): View {
  const value = hash.replace(/^#/, "");
  if (value === "campaigns" || value === "new") return { name: value };
  const match = /^c\/(\d+)$/.exec(value);
  if (match?.[1]) return { name: "campaign", id: BigInt(match[1]) };
  return { name: "landing" };
}

function hashFor(view: View): string {
  if (view.name === "campaign") return `c/${view.id}`;
  return view.name === "landing" ? "" : view.name;
}

/** One document, two surfaces: the landing scene and the app shell behind it. Hash routing
 *  keeps it client-side, so the curtain plays uninterrupted and the shell persists across
 *  page switches — only the page content inside changes. */
export default function Page() {
  const [view, setView] = useState<View>({ name: "landing" });

  useEffect(() => {
    setView(viewFromHash(window.location.hash));
    const onHash = () => {
      if (LANDING_ANCHORS.has(window.location.hash.slice(1))) return;
      setView(viewFromHash(window.location.hash));
      window.scrollTo({ top: 0, behavior: "auto" });
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = useCallback((next: View) => {
    const hash = hashFor(next);
    if (hash) window.location.hash = hash;
    else window.history.replaceState(null, "", window.location.pathname);
    setView(next);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
    <AnimatePresence mode="wait">
      {view.name === "landing" ? (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
        >
          <Landing onEnter={() => go({ name: "campaigns" })} onCreate={() => go({ name: "new" })} />
        </motion.div>
      ) : (
        <motion.div
          key="app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AppShell
            page={view.name === "new" ? "new" : "campaigns"}
            onGo={(name) => go({ name })}
          >
            {view.name === "campaigns" && (
              <CampaignsPage
                onOpen={(id) => go({ name: "campaign", id })}
                onNew={() => go({ name: "new" })}
              />
            )}
            {view.name === "campaign" && (
              <CampaignPage id={view.id} onBack={() => go({ name: "campaigns" })} />
            )}
            {view.name === "new" && (
              <NewCampaignPage onCreated={(id) => go({ name: "campaign", id })} />
            )}
          </AppShell>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
