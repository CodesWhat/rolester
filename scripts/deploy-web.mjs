#!/usr/bin/env node
// deploy:web — (re)build the marketing site + docs and ship it to the live site at
// rolester.codeswhat.com. Deploys via Vercel's Build Output API (prebuilt — no remote
// build), the same pattern deploy-demo.mjs uses. Going prebuilt sidesteps the Next-16
// static-export bug where `vercel build` serves a 404 homepage: we copy the finished
// `website/out` tree straight into `.vercel/output/static` ourselves.
//
//   Project: codeswhat/rolester-website   (link lives at website/.vercel, gitignored)
//   Scope:   codeswhat   (ALWAYS pass --scope explicitly; the CLI's default account is
//                         a different, non-public org and must never receive this deploy)
//
// `npm --workspace website run build` runs the prebuild that builds the docs-site and
// copies it to website/public/docs, so `out` already contains marketing + /docs.
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const REPO = dirname(dirname(fileURLToPath(import.meta.url)));
const WEB = join(REPO, "website");
const OUT = join(WEB, "out"); // next static export (includes /docs)
const OUTPUT = join(WEB, ".vercel/output"); // Build Output API tree, sibling of the project link

function run(cmd, args, cwd = REPO) {
  execFileSync(cmd, args, { cwd, stdio: "inherit" });
}

// 1. fresh static build → website/out (prebuild also builds + copies docs-site to public/docs)
run("npm", ["--workspace", "website", "run", "build"]);

// 2. lay out the Build Output API tree (static = the export, config v3)
console.log("\n▸ Prepare prebuilt output");
rmSync(OUTPUT, { recursive: true, force: true });
mkdirSync(join(OUTPUT, "static"), { recursive: true });
cpSync(OUT, join(OUTPUT, "static"), { recursive: true });
writeFileSync(join(OUTPUT, "config.json"), `${JSON.stringify({ version: 3 }, null, 2)}\n`);

// 3. deploy prebuilt to production under the codeswhat scope
console.log("\n▸ Deploy to Vercel (codeswhat/rolester-website, prod)");
run("vercel", ["deploy", "--prebuilt", "--prod", "--yes", "--scope", "codeswhat"], WEB);
