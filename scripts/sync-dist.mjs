import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

const outputPublic = ".output/public";
const dist = "dist";
const staticRoutes = [
  ["/", "/"],
  ["/discover", "/discover"],
  ["/learners", "/learners"],
  ["/creators", "/creators"],
  ["/pricing", "/pricing"],
  ["/about", "/about"],
  ["/auth", "/auth?mode=signup"],
  ["/onboarding", "/onboarding"],
  ["/create-community", "/create-community"],
  ["/app", "/app/dashboard"],
  ["/app/dashboard", "/app/dashboard"],
  ["/app/feed", "/app/feed"],
  ["/app/classroom", "/app/classroom"],
  ["/app/courses", "/app/courses"],
  ["/app/messages", "/app/messages"],
  ["/app/notifications", "/app/notifications"],
  ["/app/calendar", "/app/calendar"],
  ["/app/members", "/app/members"],
  ["/app/leaderboard", "/app/leaderboard"],
  ["/app/search", "/app/search"],
  ["/app/creator", "/app/creator"],
  ["/app/payouts", "/app/payouts"],
  ["/app/billing", "/app/billing"],
  ["/app/automations", "/app/automations"],
  ["/app/affiliate", "/app/affiliate"],
  ["/app/live", "/app/live"],
  ["/app/settings", "/app/settings"],
];

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
    const source = await readFile(join(assetsDir, file), "utf8");
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

function distIndexPath(routePath) {
  if (routePath === "/") return join(dist, "index.html");
  return join(dist, ...routePath.split("/").filter(Boolean), "index.html");
}

async function renderRouteFromServer(server, routePath, requestPath) {
  const context = {
    waitUntil() {},
    passThroughOnException() {},
  };
  let response = await server.fetch(new Request(`https://sukaspace.local${requestPath}`), {}, context);

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (location) {
      const redirectUrl = new URL(location, "https://sukaspace.local");
      response = await server.fetch(new Request(redirectUrl), {}, context);
    }
  }

  if (!response.ok) {
    throw new Error(`Server render for ${requestPath} failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(`Server render for ${requestPath} returned ${contentType || "an unknown content type"}.`);
  }

  const indexPath = distIndexPath(routePath);
  await mkdir(join(indexPath, ".."), { recursive: true });
  await writeFile(indexPath, await response.text());
}

async function renderRoutesFromServer() {
  const serverModule = await import("../.output/server/index.mjs");
  const server = serverModule.default ?? serverModule;

  for (const [routePath, requestPath] of staticRoutes) {
    await renderRouteFromServer(server, routePath, requestPath);
  }
}

if (!(await exists(outputPublic))) {
  throw new Error("Missing .output/public. Run vite build before syncing dist.");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(outputPublic, dist, { recursive: true });
try {
  await renderRoutesFromServer();
} catch (error) {
  console.warn(error);
  await writeStaticFallback();
}

await writeFile(join(dist, "404.html"), await readFile(join(dist, "index.html"), "utf8"));
await writeFile(join(dist, "_redirects"), "/* /index.html 200\n");

console.log("Synced Nitro public assets and prerendered route HTML to dist/ for static artifact checks.");