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
await page.goto(process.argv[2] || "http://127.0.0.1:5000/variants/call-sheet", {
  waitUntil: "networkidle0",
});
const data = await page.evaluate(() => {
  const out = [];
  const abs = (el) => {
    const r = el.getBoundingClientRect();
    return { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) };
  };
  for (const el of document.querySelectorAll("main > section, footer")) {
    const b = abs(el);
    const words = (el.innerText || "").split(/\s+/).filter((x) => /[A-Za-z0-9]/.test(x)).length;
    out.push({ tag: el.tagName, cls: el.className, ...b, words, h: b.bottom - b.top });
  }
  return { height: document.documentElement.scrollHeight, sections: out };
});
console.log(JSON.stringify(data, null, 2));
await browser.close();
