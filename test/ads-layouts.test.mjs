import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read = (p) => fs.readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("ads layout preview stays off the live home page and keeps forest-mint copy", () => {
  const page = read("src/ads-layouts.html");
  const css = read("src/assets/ads-layouts.css");
  const js = read("src/assets/ads-layouts.js");
  const home = read("src/index.html");
  assert.match(page, /name="robots" content="noindex"/);
  assert.match(page, /href="\/assets\/ads-layouts\.css"/);
  assert.match(page, /src="\/assets\/ads-layouts\.js"/);
  assert.match(page, /Preview only/);
  assert.match(page, /live home page stays a labeled placeholder until you pick/);
  for (const n of ["1", "2", "3"]) {
    assert.match(page, new RegExp('data-pick="' + n + '"'));
    assert.match(css, new RegExp('data-layout="' + n + '"'));
  }
  assert.match(css, /The live home page does not use this file/);
  assert.match(js, /The live home page does not load this file/);
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
  assert.doesNotMatch(page + css + js + home, /ZUS|AEON/i);
  assert.doesNotMatch(home, /ads-layouts/);
  assert.doesNotMatch(home, /option-a-counter|option-b-drink|option-c-kitchen|option-d-guest|option-e-pastry|option-f-till/);
});

test("six picture options exist and the preview can switch them without locking live home", () => {
  const page = read("src/ads-layouts.html");
  const js = read("src/assets/ads-layouts.js");
  const dir = new URL("../src/assets/img/showcase/", import.meta.url);
  const files = {
    a: "option-a-counter.jpg",
    b: "option-b-drink.jpg",
    c: "option-c-kitchen.jpg",
    d: "option-d-guest.jpg",
    e: "option-e-pastry.jpg",
    f: "option-f-till.jpg"
  };
  for (const [key, name] of Object.entries(files)) {
    assert.ok(fs.existsSync(new URL(name, dir)), name);
    assert.match(page, new RegExp("option-" + key));
    assert.match(js, new RegExp("/assets/img/showcase/" + name.replace(".", "\\.")));
  }
  assert.match(page, /B Drink/);
  assert.match(js, /if \(!shots\[shot\]\) shot = "b"/);
});
