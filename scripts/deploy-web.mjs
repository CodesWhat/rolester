#!/usr/bin/env node
// deploy:web — (re)build the marketing site + docs and ship it to rolester.codeswhat.com.
//
// Builds with `vercel build`, which is now correct: website/vercel.json pins
// framework:null + outputDirectory:out, so Vercel copies the whole Next static export
// (homepage + every route + /docs) into .vercel/output/static. Previously the Next-16
// framework builder only copied public/ and added a 404 fallback, so the homepage 404'd —
// which this script used to paper over by hand-copying out/ into static/. That hack is gone.
//
//   Project: codeswhat/rolester-website   (link lives at website/.vercel, gitignored)
//   Scope:   codeswhat   (ALWAYS pass --scope explicitly; the CLI's default account is a
//                         different, non-public org and must never receive this deploy)
//
// This is the manual fallback. Once the Vercel<->GitHub connection is enabled, a push to
// main auto-deploys with the same `vercel build`, and this script can be deleted.
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const WEB = join(REPO, "website");

function run(cmd, args, cwd = WEB) {
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

// 1. build → website/.vercel/output (buildCommand runs the docs prebuild + next export)
console.log("▸ vercel build (codeswhat scope, production target)");
run("vercel", ["build", "--prod", "--yes", "--scope", "codeswhat"]);

// 2. deploy the prebuilt output to production
console.log("\n▸ Deploy to Vercel (codeswhat/rolester-website, prod)");
run("vercel", ["deploy", "--prebuilt", "--prod", "--yes", "--scope", "codeswhat"]);
