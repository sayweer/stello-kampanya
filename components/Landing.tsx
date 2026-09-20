"use client";

// Landing — the marketing surface. Structure, classes and motion are carried over from the
// reference one to one; only the words, the doors and the numbers belong to Stello.
import { useCampaignList, useWallet } from "@/lib/hooks.ts";
import { useReveal } from "./landing/useReveal";
import Hero from "./landing/Hero";
import Proof from "./landing/Proof";
import HowItWorks from "./landing/HowItWorks";
import Guarantees from "./landing/Guarantees";
import Privacy from "./landing/Privacy";
import FinalCta from "./landing/FinalCta";
import Footer from "./landing/Footer";

export default function Landing({
  onEnter,
  onCreate,
}: {
  /** Into the app — the campaign list. */
  onEnter: () => void;
  /** Into the app — the organizer's form. */
  onCreate: () => void;
}) {
  useReveal();
  const campaigns = useCampaignList();
  const { address } = useWallet();

  return (
    // `lp--pending` hides the reveal targets from the first paint; useReveal either animates
    // them in or removes the class outright.
    <div className="lp lp--pending">
      <Hero campaigns={campaigns} address={address} onEnter={onEnter} onCreate={onCreate} />
      <Proof />
      <HowItWorks />
      <Guarantees />
      <Privacy />
      <FinalCta onEnter={onEnter} onCreate={onCreate} />
      <Footer campaigns={campaigns} />
    </div>
  );
}
