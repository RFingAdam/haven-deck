#!/usr/bin/env node
/**
 * Serve the built kiosk and proxy Companion / Director on the same origin
 * so a browser or Pi kiosk does not have to deal with CORS.
 *
 * Usage: npm run build && npm start
 * Config: ./config.json, or the example file copied to config.json.
 * Bind defaults to 127.0.0.1. Set bind to 0.0.0.0 only if you want other
 * devices on your network to reach this deck.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync } from "node:fs";
import { extname, join, normalize, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

function loadConfig() {
  const paths = [resolve(root, "config.json"), resolve(root, "config.example.json")];
  for (const p of paths) {
    if (existsSync(p)) return JSON.parse(readFileSync(p, "utf8"));
  }
  return {};
}

const fileCfg = loadConfig();
const bind = process.env.HAVEN_DECK_BIND || fileCfg.bind || "127.0.0.1";
const port = Number(process.env.HAVEN_DECK_PORT || fileCfg.port || 4173);
const companionBase = (process.env.COMPANION_BASE || fileCfg.companionBase || "http://127.0.0.1:8000").replace(/\/$/, "");
const directorBase = (process.env.DIRECTOR_BASE || fileCfg.directorBase || "http://127.0.0.1:8781").replace(/\/$/, "");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function isLoopbackOrPrivate(url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname;
    if (h === "127.0.0.1" || h === "localhost") return true;
    // Allow RFC1918 only from local config, never from the request path.
    return /^(10|192\.168|172\.(1[6-9]|2\d|3[0-1]))\./.test(h);
  } catch {
    return false;
  }
}

if (!isLoopbackOrPrivate(companionBase) || !isLoopbackOrPrivate(directorBase)) {
  throw new Error("companionBase and directorBase must be loopback or a private LAN URL");
}

async function proxy(req, res, targetBase, prefix) {
  const path = req.url.slice(prefix.length) || "/";
  const url = targetBase + path;
  const headers = { ...req.headers, host: new URL(targetBase).host };
  delete headers["if-none-match"];
  delete headers["if-modified-since"];
  try {
    const incoming = await readBody(req);
    const out = await fetch(url, { method: req.method, headers, body: incoming, redirect: "manual" });
    res.writeHead(out.status, {
      "content-type": out.headers.get("content-type") || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(Buffer.from(await out.arrayBuffer()));
  } catch (err) {
    res.writeHead(502, { "content-type": "application/json" });
    res.end(JSON.stringify({ error: err instanceof Error ? err.message : "proxy failed" }));
  }
}

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (c) => {
      size += c.length;
      if (size > 65536) {
        reject(new Error("Request too large"));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function serveFile(res, filePath) {
  if (!existsSync(filePath) || !statSync(filePath).isFile()) return false;
  const body = readFileSync(filePath);
  res.writeHead(200, { "content-type": TYPES[extname(filePath)] || "application/octet-stream" });
  res.end(body);
  return true;
}

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  if (url.startsWith("/companion")) return void proxy(req, res, companionBase, "/companion");
  if (url.startsWith("/director")) return void proxy(req, res, directorBase, "/director");
  if (url === "/config.json") {
    const publicCfg = {
      simulate: fileCfg.simulate !== false,
      companionBase,
      companionLabel: fileCfg.companionLabel || "slobs",
      directorBase,
      packUrl: fileCfg.packUrl || "/packs/starter",
      kioskRoute: fileCfg.kioskRoute !== false,
      wantLocalPreview: Boolean(fileCfg.wantLocalPreview),
    };
    res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
    res.end(JSON.stringify(publicCfg, null, 2));
    return;
  }
  const rel = url === "/" ? "/index.html" : url;
  const safe = normalize(rel).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(dist, safe);
  if (!filePath.startsWith(dist)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (serveFile(res, filePath)) return;
  // SPA fallback
  if (serveFile(res, join(dist, "index.html"))) return;
  res.writeHead(404);
  res.end("Not found");
});

if (!existsSync(join(dist, "index.html"))) {
  console.error("No dist/ build found. Run npm run build first.");
  process.exit(1);
}

server.listen(port, bind, () => {
  console.log(`Haven Deck kiosk on http://${bind}:${port}`);
});
