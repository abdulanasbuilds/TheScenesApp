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
  const words = [];
  const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = tw.nextNode())) {
    const p = n.parentElement;
    if (!p || !vis(p) || p.closest("script, style, noscript, svg, [data-slot], [data-credits]"))
      continue;
    const t = n.textContent.trim();
    if (!t) continue;
    const pr = p.getBoundingClientRect();
    const c = t.split(/\s+/).filter((w) => /[A-Za-z]{2,}/.test(w)).length;
    if (c)
      words.push({ top: pr.top + scrollY, bottom: pr.bottom + scrollY, c, text: t.slice(0, 60) });
  }
  const H = document.documentElement.scrollHeight;
  let maxWords = 0,
    at = 0;
  for (let y = 0; y < H; y += 50) {
    const w = Math.round(
      words.reduce((a, x) => {
        const h = Math.max(1, x.bottom - x.top);
        const ov = Math.max(0, Math.min(x.bottom, y + 900) - Math.max(x.top, y));
        return a + x.c * Math.min(1, ov / h);
      }, 0),
    );
    if (w > maxWords) {
      maxWords = w;
      at = y;
    }
  }
  const inWin = words
    .map((x) => {
      const h = Math.max(1, x.bottom - x.top);
      const ov = Math.max(0, Math.min(x.bottom, at + 900) - Math.max(x.top, at));
      return { ...x, share: Math.min(1, ov / h) };
    })
    .filter((x) => x.share > 0)
    .map((x) => ({ top: Math.round(x.top), c: x.c, share: +x.share.toFixed(2), text: x.text }));
  return { maxWords, at, inWin };
});
console.log(JSON.stringify(data, null, 1));
await browser.close();
