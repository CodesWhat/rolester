/**
 * Live-demo preview for the landing page (drydock-style): a framed, looping
 * screen-recording of the real dashboard (Dashboard → Jobs funnel → Calendar →
 * Library), captured at a fixed viewport so there's no padding/jank. The live
 * dashboard doesn't embed cleanly in an iframe, so the frame is a click-through
 * to the deployed demo, which works standalone.
 */
const DEMO_URL = "https://demo.rolester.codeswhat.com";

export default function DemoEmbed() {
  return (
    <div className="demo-embed">
      <a
        className="demo-frame"
        href={DEMO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open the live Rolester demo in a new tab"
      >
        <div className="demo-chrome">
          <span className="demo-dot demo-dot-red" />
          <span className="demo-dot demo-dot-yellow" />
          <span className="demo-dot demo-dot-green" />
          <span className="demo-chrome-url">demo.rolester.codeswhat.com</span>
        </div>
        <div className="demo-screen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="demo-gif"
            src="/rolester-demo.gif"
            alt="A tour of the Rolester dashboard — command center, jobs funnel, calendar, and evidence library"
            width={1240}
            height={738}
            loading="lazy"
          />
          <span className="demo-screen-overlay">
            <span className="demo-expand-pill">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                <path
                  d="M5 1H1v4M9 13h4V9M1 9v4h4M13 5V1H9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Open the live demo
            </span>
          </span>
        </div>
      </a>
    </div>
  );
}
