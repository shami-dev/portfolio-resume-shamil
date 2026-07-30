// Crawls every prerendered page in dist/client (plus onDemandRoutes below)
// and runs axe-core against it via a headless Chromium tab, using astro
// preview as the server so routes match production exactly. Each route is
// checked in all three color modes (BaseLayout's inline script reads
// localStorage("mode") before first paint, same mechanism ModeSwitch
// writes to) since the dark-mode phase re-tuned tokens per mode and a
// contrast regression in one mode wouldn't show up testing light alone.
// Also checked at two viewports: desktop (puppeteer's default) and a
// 390x844 mobile one — Phase 5b's mobile chrome (the scan accordion,
// the fixed bottom bar, the merged Home header) is markup and ARIA
// wiring no desktop-viewport run ever exercises, so it was unaudited
// until this pass existed.
// Fails (exit 1) if any page/mode/viewport combination has violations.
import { spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
// @astrojs/cloudflare nests static output under dist/client (see
// astro.config.mjs/wrangler.jsonc) — routes must be computed relative to
// that, not dist/ itself, or every route resolves one level too deep
// (e.g. "/client/about/") and silently tests a 404/redirect instead of
// the real page.
const distDir = join(rootDir, "dist", "client");
const port = 4322;
const baseUrl = `http://localhost:${port}`;
const modes = ["light", "anoitecer", "dark"];
// null = puppeteer's own default viewport (desktop-sized, unchanged).
const viewports = [
  { name: "desktop", size: null },
  { name: "mobile", size: { width: 390, height: 844 } },
];
// On-demand routes (prerender = false) don't produce a dist/ file, so
// findHtmlFiles() can't discover them — listed explicitly instead.
const onDemandRoutes = ["/contact"];

function findHtmlFiles(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      findHtmlFiles(full, files);
    } else if (entry.name.endsWith(".html")) {
      files.push(full);
    }
  }
  return files;
}

function toRoute(filePath) {
  const relPath = relative(distDir, filePath).split(sep).join("/");
  return (
    "/" + relPath.replace(/(^|\/)index\.html$/, "$1").replace(/\.html$/, "")
  );
}

function waitForServer(url, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    (function poll() {
      fetch(url)
        .then(() => resolve())
        .catch((err) => {
          if (Date.now() > deadline) reject(err);
          else setTimeout(poll, 200);
        });
    })();
  });
}

const routes = findHtmlFiles(distDir)
  .map(toRoute)
  .concat(onDemandRoutes)
  .sort();
const axeSource = readFileSync(
  join(rootDir, "node_modules/axe-core/axe.min.js"),
  "utf8",
);

const preview = spawn(
  "pnpm",
  ["exec", "astro", "preview", "--port", String(port)],
  { cwd: rootDir, stdio: "ignore" },
);

let exitCode = 0;
try {
  await waitForServer(baseUrl, 15000);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    for (const route of routes) {
      for (const mode of modes) {
        for (const viewport of viewports) {
          const page = await browser.newPage();
          if (viewport.size) await page.setViewport(viewport.size);
          // Same mechanism ModeSwitch persists to: BaseLayout's inline
          // script reads this before first paint. Set via
          // evaluateOnNewDocument so it's in place before that script runs.
          await page.evaluateOnNewDocument((m) => {
            localStorage.setItem("mode", m);
          }, mode);
          await page.goto(new URL(route, baseUrl).toString(), {
            waitUntil: "networkidle0",
          });
          // [data-register] elements (global.css) start at opacity:0 and
          // transition in once motion.ts's IntersectionObserver fires —
          // networkidle0 fires as soon as requests settle, which can be
          // well before that transition completes. Caught mid-transition,
          // axe reports whatever partial-opacity contrast it measures at
          // that instant as a violation, even though the settled page
          // never has one — confirmed empirically (0ms: 1 false violation
          // on /colophon anoitecer; >=200ms: 0). --t-enter-lg (550ms, the
          // longest duration) plus stagger/CI-slowness margin.
          await new Promise((resolve) => setTimeout(resolve, 800));
          await page.evaluate(axeSource);
          const { violations } = await page.evaluate(() => {
            // eslint-disable-next-line no-undef -- axe is injected into the page above
            return axe.run();
          });
          await page.close();

          const label = `${route} [${mode}, ${viewport.name}]`;
          if (violations.length > 0) {
            exitCode = 1;
            console.error(`\n✖ ${label} — ${violations.length} violation(s)`);
            for (const v of violations) {
              console.error(
                `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
              );
              console.error(`    ${v.helpUrl}`);
            }
          } else {
            console.log(`✓ ${label}`);
          }
        }
      }
    }
  } finally {
    await browser.close();
  }
} finally {
  preview.kill();
}

if (exitCode !== 0) {
  console.error("\na11y check failed: violations found above.");
} else {
  console.log("\na11y check passed: no violations found.");
}
process.exit(exitCode);
