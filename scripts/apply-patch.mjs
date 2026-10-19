#!/usr/bin/env node
// Apply the photocraft.digital editor patch to a pinned, verified upstream web release.
// Usage: node scripts/apply-patch.mjs <version> <extracted-release-dir> <output-dir>
// Example: node scripts/apply-patch.mjs 0.9.0 work/photocraft-web-0.9.0 out/0.9.0
// The input directory is never modified. Unknown inputs are rejected.
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [version, inDir, outDir] = process.argv.slice(2);
if (!version || !inDir || !outDir) {
  console.error('Usage: node scripts/apply-patch.mjs <version> <extracted-release-dir> <output-dir>');
  process.exit(2);
}
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(await readFile(path.join(repoRoot, 'patches', `v${version}`, 'patch.json'), 'utf8'));
const sha256 = (b) => createHash('sha256').update(b).digest('hex');

// 1. Copy every release file unchanged.
await mkdir(outDir, { recursive: true });
for (const name of await readdir(inDir)) {
  await copyFile(path.join(inDir, name), path.join(outDir, name));
}

// 2. Patch the Wasm module.
const wasmPath = path.join(outDir, spec.wasm.file);
const wasm = await readFile(wasmPath);
if (sha256(wasm) !== spec.wasm.inputSha256) throw new Error(`Refusing to patch unknown Wasm (sha256 ${sha256(wasm)})`);
for (const block of spec.blocks) {
  const expected = Buffer.from(block.expectedHex, 'hex');
  const actual = wasm.subarray(block.offset, block.offset + expected.length);
  if (!actual.equals(expected)) throw new Error(`Signature mismatch for "${block.name}" at offset ${block.offset}`);
  wasm.fill(0x01, block.offset, block.offset + expected.length); // 0x01 = WebAssembly `nop`
  if (block.replacementHex) Buffer.from(block.replacementHex, 'hex').copy(wasm, block.offset);
}
if (!WebAssembly.validate(wasm)) throw new Error('Patched Wasm fails WebAssembly.validate');
await writeFile(wasmPath, wasm);

// 3. Update the Wasm preload integrity in index.html (the only HTML change).
const htmlPath = path.join(outDir, spec.html.file);
const html = await readFile(htmlPath, 'utf8');
if (sha256(Buffer.from(html)) !== spec.html.inputSha256) throw new Error('Refusing to patch unknown index.html');
const integrity = createHash('sha384').update(wasm).digest('base64');
const newHtml = html.replace(/(href="\.\/[^"]+_bg\.wasm"[^>]*integrity=")([^"]+)/, `$1sha384-${integrity}`);
if (newHtml === html) throw new Error('Wasm preload integrity attribute not found');
await writeFile(htmlPath, newHtml);

// 4. Check against the published output digests.
const results = [
  [spec.wasm.file, sha256(wasm), spec.wasm.outputSha256],
  [spec.html.file, sha256(Buffer.from(newHtml)), spec.html.outputSha256],
];
let ok = true;
for (const [file, got, want] of results) {
  const match = got === want;
  ok &&= match;
  console.log(`${match ? 'OK  ' : 'DIFF'} ${file} ${got}${match ? '' : ` (expected ${want})`}`);
}
process.exit(ok ? 0 : 1);
