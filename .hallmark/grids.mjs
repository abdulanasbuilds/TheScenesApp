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
  const out = [];
  for (const el of document.querySelectorAll("div, ul, ol, nav")) {
    const cs = getComputedStyle(el);
    const isGrid = cs.display.includes("grid");
    const isFlex = cs.display.includes("flex") && cs.flexWrap === "wrap";
    if (!isGrid && !isFlex) continue;
    const kids = [...el.children].filter((k) => {
      const r = k.getBoundingClientRect();
      return r.width > 1 && r.height > 1;
    });
    if (kids.length < 2) continue;
    const rs = kids.map((k) => k.getBoundingClientRect());
    const cols = new Set(rs.map((r) => Math.round(r.left))).size;
    const rows = new Set(rs.map((r) => Math.round(r.top))).size;
    const lastRow = rs.filter(
      (r) => Math.round(r.top) === Math.max(...rs.map((x) => Math.round(x.top))),
    ).length;
    out.push({
      cls: typeof el.className === "string" ? el.className : "",
      display: cs.display,
      cols,
      rows,
      lastRow,
      kids: kids.length,
    });
  }
  return out;
});
for (const d of data) {
  if (d.rows > 1 && d.lastRow === 1 && d.cols > 2) console.log("ORPHAN?", JSON.stringify(d));
}
console.log("---all---");
for (const d of data) console.log(JSON.stringify(d));
await browser.close();
