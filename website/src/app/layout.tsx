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
        {/* Flag JS as available so the reveal animation only hides content when
            it can be revealed. Without this, .reveal content would stay invisible
            if JS / IntersectionObserver ever failed. Mirrors the mockup's head
            script; runs before the sections below it paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js');",
          }}
        />
        {children}
      </body>
    </html>
  );
}
