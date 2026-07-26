import { copyFile, cp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputPublic = ".output/public";
const dist = "dist";

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findClientEntry() {
  const assetsDir = join(dist, "assets");
  const files = await readdir(assetsDir);

  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const source = await import("node:fs/promises").then(({ readFile }) =>
      readFile(join(assetsDir, file), "utf8"),
    );
    if (source.includes("hydrateRoot")) return `/assets/${file}`;
  }

  return undefined;
}

async function findStylesheet() {
  const assetsDir = join(dist, "assets");
  const files = await readdir(assetsDir);
  const stylesheet = files.find((file) => file.startsWith("styles-") && file.endsWith(".css"));
  return stylesheet ? `/assets/${stylesheet}` : undefined;
}

async function writeStaticFallback() {
  const indexPath = join(dist, "index.html");
  if (await exists(indexPath)) return;

  const clientEntry = await findClientEntry();
  if (!clientEntry) {
    throw new Error("Could not locate the TanStack client entry in dist/assets.");
  }

  const stylesheet = await findStylesheet();
  const stylesheetTag = stylesheet ? `    <link rel="stylesheet" href="${stylesheet}" />\n` : "";

  await writeFile(
    indexPath,
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <title>SukaSpace — Community + Courses for the AI Era</title>
    <meta name="description" content="Launch a premium learning community with linear course tracking and rich multi-channel discussions." />
    <meta name="theme-color" content="#1D4ED8" />
    <link rel="manifest" href="/manifest.json" />
    <link rel="icon" href="/favicon.ico" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
${stylesheetTag}  </head>
  <body>
    <script type="module" src="${clientEntry}"></script>
  </body>
</html>
`,
  );
}

if (!(await exists(outputPublic))) {
  throw new Error("Missing .output/public. Run vite build before syncing dist.");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(outputPublic, dist, { recursive: true });
await writeStaticFallback();

if (await exists("wrangler.toml")) {
  await copyFile("wrangler.toml", join(dist, "wrangler.toml"));
}

console.log("Synced Nitro public assets to dist/ for static artifact checks.");