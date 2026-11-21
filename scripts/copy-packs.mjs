import { cpSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function copyDir(name) {
  const from = resolve(root, name);
  const to = resolve(root, "public", name);
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`copied ${name} to public/${name}`);
}

copyDir("packs");
copyDir("themes");
