// The website uses the app's brand tokens (docs/ui-direction.md in the app repo).
// src/assets/brand-tokens.css must be an exact copy of ordenz-app server/public/css/brand-tokens.css.
// When the app's file changes, its test fails until the new hash is recorded there; copy the file here and
// update TOKENS_SHA256 below to the same value.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";

const TOKENS_SHA256 = "89e0fd597ca2ab107f5ef13d4cd02bd1be82a46c05b6ca86f97b62aa9f7cd8b6";
const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), "utf8");
const tokens = read("src/assets/brand-tokens.css");

test("brand-tokens.css is the same file as the app's", () => {
  assert.equal(createHash("sha256").update(tokens).digest("hex"), TOKENS_SHA256);
});

test("every page loads brand-tokens.css before its own stylesheet", () => {
  const pages = ["src/_partials/head.html", "src/ads-layouts.html", "src/cafe-in-motion.html", "src/hero-layouts.html", "src/hero-design.html"];
  for (const p of pages) {
    const html = read(p);
    const at = html.indexOf('href="/assets/brand-tokens.css"');
    assert.ok(at > 0, `${p} links brand-tokens.css`);
    for (const css of ["/assets/site.css", "/assets/hero-design.css"]) {
      const i = html.indexOf(`href="${css}"`);
      if (i > 0) assert.ok(at < i, `${p}: brand-tokens.css must come before ${css}`);
    }
  }
});

test("site styles do not redefine brand tokens", () => {
  const names = [...new Set([...tokens.matchAll(/--([a-z0-9-]+)\s*:/g)].map((m) => m[1]))];
  for (const f of readdirSync(new URL("../src/assets/", import.meta.url)).filter((n) => n.endsWith(".css") && n !== "brand-tokens.css")) {
    const css = read(`src/assets/${f}`);
    for (const n of names) assert.doesNotMatch(css, new RegExp(`(^|[;{\\s])--${n}\\s*:`), `${f} sets --${n}; change it in brand-tokens.css`);
  }
});

test("the hero uses saffron, not the old teal", () => {
  for (const f of readdirSync(new URL("../src/assets/", import.meta.url)).filter((n) => n.endsWith(".css"))) {
    assert.doesNotMatch(read(`src/assets/${f}`), /#2EE6C7/i, `${f} still uses the old teal`);
  }
});
