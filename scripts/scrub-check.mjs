#!/usr/bin/env node
/**
 * Fail if the tree contains private or reserved material that must never
 * ship in the public Haven Deck repo.
 */
import { execSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const SKIP_DIR = new Set(["node_modules", "dist", ".git"]);

const PATTERNS = [
  { re: /wardogs/i, why: "reserved private audio / project name" },
  { re: /whos_got_ammo|he_called_it_a_landing|i_built_this_fob|funeral_for_a_drill|seven_fobs|still_on_the_hammer|you_two_keep_rapping|thirty_one_and_fine|park_the_apc|fob_is_not_a_spawn/i, why: "reserved song filename" },
  { re: /\bfa_(landing|arms|jhook|hotzone|spawn_up|collective|logi|rotors|fob_stop|doors|too_early|welcome|parachute|thirty)\b/i, why: "reserved spoken-line id" },
  { re: /elevenlabs/i, why: "private TTS vendor account material" },
  { re: /ironhaven/i, why: "private network name" },
  { re: /\bsentinel\b/i, why: "private homelab app name" },
  { re: /bigbeast|minibeast|sdr-node/i, why: "private hostname" },
  { re: /\b(proxmox|pfsense|tautulli|uptime[- ]?kuma|homeassistant|home assistant|openclaw|kiwix)\b/i, why: "homelab integration" },
  { re: /swampbewdy-banana/i, why: "private mixer profile" },
  { re: /C:\\\\Users\\/i, why: "personal filesystem path" },
  { re: /\b(ELEVENLABS_API_KEY|TELEGRAM_BOT_TOKEN|DISCORD_BOT_TOKEN|HA_TOKEN|TASKS_API_TOKEN|NEXT_PUBLIC_HA_TOKEN)\b/, why: "secret environment name" },
  { re: /(api[_-]?key|token|secret)\s*[:=]\s*['"][A-Za-z0-9_-]{16,}/i, why: "looks like a credential assignment" },
  { re: /\b10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3}\b/, why: "hardcoded 10.x address" },
  { re: /\b192\.168\.(?:[0-9]{1,3}\.)[0-9]{1,3}\b/, why: "hardcoded 192.168 address" },
  { re: /\b172\.(1[6-9]|2[0-9]|3[0-1])\.(?:[0-9]{1,3}\.)[0-9]{1,3}\b/, why: "hardcoded 172.16/12 address" },
];

// Allow the kiosk server to mention RFC1918 in a validator, without literals.
const ALLOW_REL = new Set([
  "scripts/scrub-check.mjs",
]);

const hits = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIR.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full);
      continue;
    }
    if (st.size > 1_000_000) continue;
    if (/\.(wav|png|jpg|jpeg|gif|webp|ico|woff2?|zip)$/i.test(name)) continue;
    const rel = relative(root, full).replaceAll("\\", "/");
    if (ALLOW_REL.has(rel)) continue;
    let text;
    try {
      text = readFileSync(full, "utf8");
    } catch {
      continue;
    }
    if (text.includes("\u0000")) continue;
    for (const { re, why } of PATTERNS) {
      const m = text.match(re);
      if (m) hits.push({ rel, why, sample: m[0] });
    }
  }
}

walk(root);

if (hits.length) {
  console.error("Scrub check failed:");
  for (const h of hits) console.error(`  ${h.rel}: ${h.why} (${JSON.stringify(h.sample)})`);
  process.exit(1);
}

// History must be fresh: no imported private remotes.
try {
  const remotes = execSync("git remote -v", { cwd: root, encoding: "utf8" });
  if (/homelab-dash|haven-fx|stream-keeper/i.test(remotes)) {
    console.error("Scrub check failed: a private repo is configured as a git remote");
    process.exit(1);
  }
} catch {
  // not a git repo yet
}

console.log("Scrub check passed.");
