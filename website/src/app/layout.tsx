import type { Metadata, Viewport } from "next";
import { Fraunces } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

// Self-hosted variable fonts — no external font CDN at runtime.
const geist = localFont({
  src: "./fonts/GeistVF.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff2",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
});

// next/font/google self-hosts Fraunces at build time (downloaded once, served
// from our own domain) — nothing hits Google at runtime.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "600", "900"],
  style: ["normal"],
  variable: "--font-display",
  display: "swap",
});

const siteDescription =
  "A local-first, agent-driven job-search workspace. Define what you actually want, vet real jobs before chasing them, write honest applications from your own evidence, and track every outcome — all on your own machine, with your own AI.";

export const metadata: Metadata = {
  title: "Rolester — Find, vet, and advance the right roles.",
  description: siteDescription,
  applicationName: "Rolester",
  keywords: [
    "job search",
    "local-first",
    "agentic",
    "resume",
    "career",
    "privacy",
  ],
  openGraph: {
    title: "Rolester — Find, vet, and advance the right roles.",
    description: siteDescription,
    siteName: "Rolester",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rolester — Find, vet, and advance the right roles.",
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#faf6ef",
  width: "device-width",
  initialScale: 1,
};

// Inline bootstrap script: sets the `js` class on <html> AND immediately arms
// the reveal IntersectionObserver. Both live in the same script so they share
// fate — if the script runs, the gate opens AND the revealer is armed. If the
// bundle is blocked (ad-blocker, CSP, network failure) but this inline script
// still executes, content is revealed correctly. Falls back to making all
// .reveal elements visible immediately when IntersectionObserver is unavailable
// or the user prefers reduced motion.
const REVEAL_BOOTSTRAP =
  "(function(){var d=document,de=d.documentElement;de.classList.add('js');var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;function all(){var e=d.querySelectorAll('.reveal');for(var i=0;i<e.length;i++)e[i].classList.add('visible');}function arm(){if(reduce||!('IntersectionObserver' in window)){all();return;}var io=new IntersectionObserver(function(en){for(var i=0;i<en.length;i++){if(en[i].isIntersecting){en[i].target.classList.add('visible');io.unobserve(en[i].target);}}},{threshold:0.12,rootMargin:'0px 0px -40px 0px'});var e=d.querySelectorAll('.reveal');for(var i=0;i<e.length;i++)io.observe(e[i]);}if(d.readyState==='loading'){d.addEventListener('DOMContentLoaded',arm);}else{arm();}})();";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${geistMono.variable} ${fraunces.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Sets the `js` class and arms the reveal IntersectionObserver inline
            so both the gate and the revealer share fate. If the JS bundle is
            blocked but this inline script still runs, .reveal content is still
            revealed. Runs before the sections below it paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: REVEAL_BOOTSTRAP,
          }}
        />
        {children}
      </body>
    </html>
  );
}
