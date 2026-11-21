/**
 * Capture 800x480 demo-mode screenshots for the README, then frame a hero image.
 * Usage: npm run docs:shots
 */
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = resolve(root, "docs/media");
const port = 4173;
const baseURL = `http://127.0.0.1:${port}`;

function startServer() {
  return new Promise((resolveStart, reject) => {
    const child = spawn("npm", ["start"], { cwd: root, stdio: ["ignore", "pipe", "pipe"], detached: true });
    const onData = (buf) => {
      const text = buf.toString();
      if (text.includes(`http://127.0.0.1:${port}`) || text.includes(`http://0.0.0.0:${port}`)) {
        child.stdout.off("data", onData);
        resolveStart(child);
      }
    };
    child.stdout.on("data", onData);
    child.stderr.on("data", (buf) => process.stderr.write(buf));
    child.on("exit", (code) => reject(new Error(`kiosk server exited ${code}`)));
    setTimeout(() => resolveStart(child), 4000);
  });
}

async function shot(page, testId, file) {
  if (testId === "tab-live") {
    // already on live after goto
  } else {
    await page.getByTestId(testId).click();
  }
  await page.getByTestId("deck-shell").waitFor();
  // let tab state paint
  await page.waitForTimeout(200);
  const path = resolve(outDir, file);
  await page.screenshot({ path, type: "png" });
  console.log("wrote", path);
}

const server = await startServer();
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 800, height: 480 },
  deviceScaleFactor: 2,
  colorScheme: "dark",
});
await page.goto(baseURL, { waitUntil: "networkidle" });
await page.getByTestId("deck-shell").waitFor();
await shot(page, "tab-live", "live.png");
await shot(page, "tab-sounds", "sounds.png");
await shot(page, "tab-setup", "setup.png");

const themeIds = ["haven", "tactical-hud", "clean-dark", "neon"];
for (const id of themeIds) {
  await page.goto(`${baseURL}/?theme=${id}`, { waitUntil: "networkidle" });
  await page.getByTestId("deck-shell").waitFor();
  await page.waitForFunction((themeId) => document.documentElement.dataset.theme === themeId, id);
  await page.waitForTimeout(200);
  const themePath = resolve(outDir, `theme-${id}.png`);
  await page.screenshot({ path: themePath, type: "png" });
  console.log("wrote", themePath);
}

await browser.close();
try { process.kill(-server.pid, "SIGTERM"); } catch {}
await new Promise((r) => setTimeout(r, 300));
try { process.kill(-server.pid, "SIGKILL"); } catch {}

const { spawnSync } = await import("node:child_process");
const framed = spawnSync("python3", [resolve(root, "scripts/frame-hero.py")], {
  cwd: root,
  stdio: "inherit",
});
if (framed.status !== 0) process.exit(framed.status ?? 1);

writeFileSync(
  resolve(outDir, "README.md"),
  [
    "# Media",
    "",
    "These screenshots were captured from a headless browser at 800×480, in demo mode,",
    "by `npm run docs:shots`. Do not commit captures taken against a live stream computer.",
    "",
  ].join("\n"),
);
process.exit(0);
