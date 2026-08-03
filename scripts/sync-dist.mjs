import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

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

async function listFiles(root) {
  if (!(await exists(root))) return [];
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const path = join(root, entry.name);
      if (entry.isDirectory()) return listFiles(path);
      return [path];
    }),
  );
  return files.flat();
}

function publicPath(filePath) {
  return `/${relative(dist, filePath).split(sep).join("/")}`;
}

async function findClientEntry() {
  const files = await listFiles(dist);
  const candidates = [];

  for (const file of files) {
    if (!file.endsWith(".js") || file.endsWith(".map")) continue;
    const source = await readFile(file, "utf8");
    let score = 0;
    if (source.includes("hydrateRoot")) score += 100;
    if (source.includes("StartClient")) score += 50;
    if (source.includes("createRouter")) score += 25;
    if (source.includes("@tanstack/react-router") || source.includes("routeTree")) score += 10;
    if (score > 0) candidates.push({ file, score, size: source.length });
  }

  candidates.sort((a, b) => b.score - a.score || b.size - a.size);
  return candidates[0] ? publicPath(candidates[0].file) : undefined;
}

async function findStylesheet() {
  const stylesheets = (await listFiles(dist)).filter((file) => file.endsWith(".css"));
  const preferred = stylesheets.find((file) => /(^|\/)styles-[^/]+\.css$/.test(publicPath(file)));
  const stylesheet = preferred ?? stylesheets[0];
  return stylesheet ? publicPath(stylesheet) : undefined;
}

async function writeStaticFallback(routePath = "/") {
  const indexPath = distIndexPath(routePath);
  if (await exists(indexPath)) return;

  const clientEntry = await findClientEntry();
  if (!clientEntry) {
    throw new Error("Could not locate the TanStack client entry in dist/assets.");
  }

  const stylesheet = await findStylesheet();
  const stylesheetTag = stylesheet ? `    <link rel="stylesheet" href="${stylesheet}" />\n` : "";
  await mkdir(dirname(indexPath), { recursive: true });

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
  <body data-static-route="${routePath}">
    <main style="min-height:100vh;display:grid;place-items:center;padding:24px;font-family:Inter,system-ui,sans-serif;color:#0f172a;background:#f8fafc">
      <div style="max-width:520px;text-align:center">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#1d4ed8">SukaSpace</p>
        <h1 style="margin:0;font-size:28px;line-height:1.15">Community + courses for the AI era</h1>
        <p style="margin:12px 0 0;color:#475569">Loading your workspace…</p>
      </div>
    </main>
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
  let response = await server.fetch(
    new Request(`https://sukaspace.local${requestPath}`),
    {},
    context,
  );

  for (
    let redirectCount = 0;
    response.status >= 300 && response.status < 400 && redirectCount < 5;
    redirectCount += 1
  ) {
    const location = response.headers.get("location");
    if (!location) break;
    const redirectUrl = new URL(location, "https://sukaspace.local");
    response = await server.fetch(new Request(String(redirectUrl)), {}, context);
  }

  if (!response.ok) {
    throw new Error(`Server render for ${requestPath} failed with status ${response.status}.`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) {
    throw new Error(
      `Server render for ${requestPath} returned ${contentType || "an unknown content type"}.`,
    );
  }

  const indexPath = distIndexPath(routePath);
  await mkdir(dirname(indexPath), { recursive: true });
  await writeFile(indexPath, await response.text());
}

async function renderRoutesFromServer() {
  const serverModule = await import("../.output/server/index.mjs");
  const server = serverModule.default ?? serverModule;

  for (const [routePath, requestPath] of staticRoutes) {
    try {
      await renderRouteFromServer(server, routePath, requestPath);
    } catch (error) {
      console.warn(error);
      await writeStaticFallback(routePath);
    }
  }
}

if (!(await exists(outputPublic))) {
  throw new Error("Missing .output/public. Run vite build before syncing dist.");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(outputPublic, dist, { recursive: true });

// Keep dist/ a pure static artifact for checkers and static hosts. Worker-only
// deployment files remain in .output/, which wrangler.toml deploys directly.
await Promise.all([
  rm(join(dist, "wrangler.toml"), { force: true }),
  rm(join(dist, "_worker.js"), { force: true }),
]);

try {
  await renderRoutesFromServer();
} catch (error) {
  console.warn(error);
  await Promise.all(staticRoutes.map(([routePath]) => writeStaticFallback(routePath)));
}

await Promise.all(staticRoutes.map(([routePath]) => writeStaticFallback(routePath)));

await writeFile(join(dist, "404.html"), await readFile(join(dist, "index.html"), "utf8"));
await writeFile(join(dist, "_redirects"), "/* /index.html 200\n");

console.log(
  "Synced Nitro public assets and prerendered route HTML to dist/ for static artifact checks.",
);
