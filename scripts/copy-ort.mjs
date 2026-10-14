// Copies the onnxruntime-web WebAssembly files into public/ort so the browser can load them
// from this site (no CDN needed). Runs automatically after `npm install` (see "postinstall").
import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "onnxruntime-web", "dist");
const dest = join(root, "public", "ort");
const files = ["ort-wasm-simd-threaded.wasm", "ort-wasm-simd-threaded.mjs"];

if (!existsSync(src)) {
  console.warn("[copy-ort] onnxruntime-web is not installed; skipping.");
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
for (const f of files) copyFileSync(join(src, f), join(dest, f));
console.log(`[copy-ort] copied ${files.length} files to public/ort`);
