// Demo-only fictional-corp logos for the seeded evil-corp fixtures. Referenced
// by path (relative to the generated workspace/tracker.html) — the real files
// live in assets/logos/. Keyed by lowercased company name; only the demo seed
// matches. Real workspaces use logo.dev (opt-in) or monogram avatars.
//
// These are placeholders: stripDemo() drops every demo:true row the moment a
// real application/sourced entry arrives from the skills, so the fixtures — and their
// logos — disappear automatically. See dashboard.mjs.
//
// Companies without a file here fall back to a monogram avatar.
export const DEMO_LOGOS = {
  // accepted / offers / finals
  "e corp": { src: "../assets/logos/e-corp.png" },
  "aperture science": { src: "../assets/logos/aperture-science.png" },
  hooli: { src: "../assets/logos/hooli.png" },
  "weyland-yutani": { src: "../assets/logos/weyland-yutani.png" },
  "cyberdyne systems": { src: "../assets/logos/cyberdyne.jpg" },
  "pied piper": { src: "../assets/logos/pied-piper.png" },
  // interview
  "tyrell corporation": { src: "../assets/logos/tyrell.png" },
  "black mesa": { src: "../assets/logos/black-mesa.svg" },
  "massive dynamic": { src: "../assets/logos/massive-dynamic.webp" },
  "abstergo industries": { src: "../assets/logos/abstergo.png" },
  // screen
  "omni consumer products": { src: "../assets/logos/ocp.png" },
  "umbrella corporation": { src: "../assets/logos/umbrella.svg" },
  "buy n large": { src: "../assets/logos/buy-n-large.svg" },
  "vault-tec": { src: "../assets/logos/vault-tec.svg" },
  aviato: { src: "../assets/logos/aviato.svg" },
  // applied
  "nakatomi corporation": { src: "../assets/logos/nakatomi.png" },
  "veridian dynamics": { src: "../assets/logos/veridian.png" },
  "dharma initiative": { src: "../assets/logos/dharma.svg" },
  ingen: { src: "../assets/logos/ingen.jpg" },
  biosyn: { src: "../assets/logos/biosyn.png" },
  initech: { src: "../assets/logos/initech.png" },
  bachmanity: { src: "../assets/logos/bachmanity.svg" },
  encom: { src: "../assets/logos/encom.png" },
  momcorp: { src: "../assets/logos/momcorp.png" },
  // rejected / withdrawn
  spectre: { src: "../assets/logos/spectre.jpg" },
  "spacely sprockets": { src: "../assets/logos/spacely.jpg" },
  "zorg industries": { src: "../assets/logos/zorg.png" },
  cobra: { src: "../assets/logos/cobra.png" },
  "monsters inc": { src: "../assets/logos/monsters-inc.svg" },
};
