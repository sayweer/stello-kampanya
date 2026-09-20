import type { StepName } from "@/lib/campaign";
import { tr } from "./tr";
import { en } from "./en";

export const LANGS = ["tr", "en"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: string): value is Lang {
  return (LANGS as readonly string[]).includes(value);
}

export function otherLang(lang: Lang): Lang {
  return lang === "tr" ? "en" : "tr";
}

/**
 * Every string this app shows. Both languages implement the type, so a line
 * added to one and forgotten in the other fails to compile.
 */
export type Copy = {
  meta: { title: string; description: string };

  /** Units and locale for the formatting helpers in components/shell/format.ts. */
  format: {
    locale: string;
    over: string;
    day: string;
    hour: string;
    minute: string;
    second: string;
  };

  /** One word for where a campaign stands. */
  verdict: { succeeded: string; failed: string; waiting: string; open: string };

  /** What the user is waiting on, in their own terms rather than the protocol's. */
  steps: Record<StepName, string>;

  nav: {
    proof: string;
    how: string;
    guarantees: string;
    privacy: string;
    toLight: string;
    toDark: string;
    light: string;
    dark: string;
    campaigns: string;
    langLabel: string;
  };

  hero: {
    /** The mark must be a substring of the headline: it gets the highlight wipe. */
    headline: string;
    mark: string;
    lede: string;
    join: string;
    joinHint: string;
    create: string;
    createHint: string;
    back: string;
    backHint: string;
    countCampaigns: string;
    countPledged: string;
    countPeople: string;
    award: string;
  };

  proof: {
    title: string;
    lede: string;
    pledgedLabel: string;
    pledgedOf: string;
    pledgedNote: string;
    lateLabel: string;
    lateValue: string;
    latePill: string;
    returnedLabel: string;
    returnedValue: string;
    returnedNote: string;
    jailTitle: string;
    jailLede: string;
    jailSteps: string[];
    jailFoot: string;
    linkRefund: string;
    linkRouter: string;
  };

  how: {
    title: string;
    lede: string;
    steps: { n: string; t: string; d: string }[];
    link: string;
  };

  guarantees: {
    title: string;
    lede: string;
    items: { n: string; t: string; d: string }[];
    keyText: string;
    keyStrong: string;
    link: string;
  };

  privacy: {
    title: string;
    lede: string;
    cards: { k: string; v: string; note: string }[];
    link: string;
  };

  finalCta: { title: string; lede: string; browse: string; create: string };

  footer: {
    line: string;
    product: string;
    campaigns: string;
    create: string;
    resources: string;
    architecture: string;
    onChain: string;
    router: string;
    campaignContract: string;
    landing: string;
    badge: string;
    openSource: string;
    /** "%c campaigns · %a USDC pledged — all checkable above." */
    totals: string;
    author: string;
    event: string;
  };

  shell: { campaigns: string; create: string; testnet: string; docs: string; close: string };

  campaignsPage: {
    emptyTitle: string;
    emptyNote: string;
    emptyCta: string;
    featuredEyebrow: string;
    /** "%t left" */
    featuredLeft: string;
    peopleJoined: string;
    openCampaign: string;
    reading: string;
    noneYet: string;
    noneNote: string;
    allCampaigns: string;
    open: string;
    closed: string;
    colLeft: string;
    colStatus: string;
    colCampaign: string;
    colRaised: string;
    readingChain: string;
    noCampaigns: string;
    howToJoin: string;
    joinSteps: string[];
    rules: string;
    ruleBonus: string;
    ruleBonusValue: string;
    ruleRefund: string;
    ruleRefundValue: string;
    ruleOnce: string;
    ruleOnceValue: string;
    create: string;
  };

  campaignPage: {
    /** "Campaign #%n" */
    eyebrow: string;
    left: string;
    unreadable: string;
    readingChain: string;
    back: string;
    joinEyebrow: string;
    joinTitle: string;
    amountLabel: string;
    amountAria: string;
    preparing: string;
    showIban: string;
    joinNote: string;
    /** "%f / %b USDC" */
    notLiveYet: string;
    transferEyebrow: string;
    transferTitle: string;
    recipient: string;
    amount: string;
    willCredit: string;
    waiting: string;
    confirmTransfer: string;
    transferNote: string;
    joined: string;
    failedEyebrow: string;
    failedTitle: string;
    yourReturn: string;
    sending: string;
    cashOut: string;
    /** "%a was sent to your IBAN." */
    paidOut: string;
    paidOutPlain: string;
    succeeded: string;
    toGoal: string;
    peopleShort: string;
    remaining: string;
    yourShare: string;
    pledged: string;
    ifItFails: string;
    rules: string;
    lockedBonus: string;
    perPersonCap: string;
    organizer: string;
  };

  newPage: {
    eyebrow: string;
    title: string;
    note: string;
    whatFor: string;
    titlePlaceholder: string;
    titleAria: string;
    goal: string;
    goalAria: string;
    bonus: string;
    bonusAria: string;
    cap: string;
    capAria: string;
    capNote: string;
    duration: string;
    durations: { label: string; seconds: number }[];
    opening: string;
    submit: string;
    whyBonus: string;
    whyBonusText: string;
    whyCap: string;
    whyCapText: string;
  };
};

const COPY: Record<Lang, Copy> = { tr, en };

export function getCopy(lang: Lang): Copy {
  return COPY[lang];
}
