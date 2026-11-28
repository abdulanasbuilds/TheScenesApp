import { createRequire } from "node:module";
import { execSync } from "node:child_process";

const root = execSync("npm root -g", { encoding: "utf8" }).trim();
const req = createRequire(root + "/noop.js");
let puppeteer;
for (const name of ["puppeteer-core", "puppeteer"]) {
  try {
    puppeteer = (await import("file:///" + req.resolve(name).replace(/\\/g, "/"))).default;
    break;
  } catch {}
}
const browser = await puppeteer.launch({
  executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  headless: true,
});
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto(process.argv[2], { waitUntil: "networkidle0" });
const data = await page.evaluate(() => {
  const vis = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || parseFloat(s.opacity) === 0)
      return false;
    const r = el.getBoundingClientRect();
    return r.width > 1 && r.height > 1;
  };
  const out = [];
  for (const g of document.querySelectorAll("*")) {
    const cs = getComputedStyle(g);
    const grid = /grid/.test(cs.display);
    const wrap =
      /flex/.test(cs.display) && cs.flexWrap === "wrap" && cs.flexDirection.startsWith("row");
    if ((!grid && !wrap) || g.closest("nav, footer, form")) continue;
    const kids = [...g.children].filter(
      (c) => vis(c) && !/absolute|fixed/.test(getComputedStyle(c).position),
    );
    if (kids.length < 3) continue;
    const rects = kids.map((c) => c.getBoundingClientRect());
    if (
      grid &&
      Math.max(...rects.map((r) => r.width)) > Math.min(...rects.map((r) => r.width)) * 1.15
    )
      continue;
    if (
      wrap &&
      !kids.every(
        (c) =>
          c.querySelector("img, svg") ||
          /^(IMG|svg)$/.test(c.tagName) ||
          c.getBoundingClientRect().width >= 120,
      )
    )
      continue;
    const rows = [];
    for (const r of rects) {
      const row = rows.find((x) => Math.abs(x.top - r.top) < 4);
      if (row) row.n++;
      else rows.push({ top: r.top, n: 1 });
    }
    rows.sort((a, b) => a.top - b.top);
    if (rows.length >= 2 && rows[rows.length - 1].n === 1 && rows[rows.length - 2].n >= 2) {
      out.push({
        tag: g.tagName,
        cls: String(g.className),
        kids: kids.length,
        rows: rows.map((x) => x.n),
        texts: kids.map((k) => (k.innerText || k.tagName).trim().slice(0, 24)),
      });
    }
  }
  return out;
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
