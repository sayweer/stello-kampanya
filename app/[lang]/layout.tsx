import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";

import { LANGS, getCopy, isLang } from "@/lib/copy";
import { LangProvider } from "@/lib/copy/context";

import "../globals.css";
import "../appnav.css";
import "../landing.css";
import "../shell.css";
import "../ledger.css";

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLang(lang)) return {};
  const { meta } = getCopy(lang);
  return {
    title: meta.title,
    description: meta.description,
    icons: { icon: "/favicon.svg" },
    alternates: { languages: Object.fromEntries(LANGS.map((l) => [l, `/${l}`])) },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/* Theme is applied before first paint, and for the whole document rather than just the
   landing: useTheme only runs while the landing is mounted, so a dark preference would be
   dropped the moment someone opened the app shell. Light is the brand default. */
const themeScript = `try{var t=localStorage.getItem("stello-theme");if(t!=="dark"&&t!=="light")t="light";document.documentElement.setAttribute("data-theme",t);}catch(e){}`;

export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {/* Landing identity: Questrial for headings, Geist for body, Kalnia for the wordmark
            and the opening curtain only. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Questrial&family=Geist:wght@300;400;500;600;700&family=Kalnia:wght@500&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <LangProvider lang={lang}>{children}</LangProvider>
      </body>
    </html>
  );
}
