// Crawls every prerendered page in dist/ and runs axe-core against it via
// a headless Chromium tab, using astro preview as the static server so
// routes match production exactly. Fails (exit 1) if any page has
// violations.
import { spawn } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const rootDir = fileURLToPath(new URL("..", import.meta.url));
const distDir = join(rootDir, "dist");
const port = 4322;
const baseUrl = `http://localhost:${port}`;

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

const routes = findHtmlFiles(distDir).map(toRoute).sort();
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
      const page = await browser.newPage();
      await page.goto(new URL(route, baseUrl).toString(), {
        waitUntil: "networkidle0",
      });
      await page.evaluate(axeSource);
      const { violations } = await page.evaluate(() => {
        // eslint-disable-next-line no-undef -- axe is injected into the page above
        return axe.run();
      });
      await page.close();

      if (violations.length > 0) {
        exitCode = 1;
        console.error(`\n✖ ${route} — ${violations.length} violation(s)`);
        for (const v of violations) {
          console.error(
            `  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`,
          );
          console.error(`    ${v.helpUrl}`);
        }
      } else {
        console.log(`✓ ${route}`);
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
