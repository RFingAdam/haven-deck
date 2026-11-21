import { cpSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const from = resolve(root, "packs");
const to = resolve(root, "public", "packs");
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log("copied packs to public/packs");
