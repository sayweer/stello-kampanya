import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import "./appnav.css";
import "./landing.css";
import "./shell.css";
import "./ledger.css";

export const metadata: Metadata = {
  title: "Stello — hedef tutmazsa, kazanan sen olursun",
  description:
    "Banka havalesiyle katıl. Hedef tutmazsa paran ve bonustan payın kendiliğinden hesabına döner.",
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

/* Theme is applied before first paint, and for the whole document rather than just the
   landing: useTheme only runs while the landing is mounted, so a dark preference would be
   dropped the moment someone opened the app shell. Light is the brand default. */
const themeScript = `try{var t=localStorage.getItem("stello-theme");if(t!=="dark"&&t!=="light")t="light";document.documentElement.setAttribute("data-theme",t);}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
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
      <body>{children}</body>
    </html>
  );
}
