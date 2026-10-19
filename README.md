# photocraft-digital-patches

How [photocraft.digital](https://photocraft.digital/) changes the upstream PhotoCraft web editor,
with scripts to reproduce and verify every served byte.

> **Unofficial.** photocraft.digital is an independent, third-party site. It is not affiliated
> with, endorsed by or supported by the ArtCraft team or the PhotoCraft project. Based on
> PhotoCraft by the ArtCraft team: <https://github.com/storytold/photocraft>.
>
> The **in-browser editor** on photocraft.digital is a **modified build**: it is not
> byte-identical to the upstream release. The **desktop installers** are unmodified upstream files.

## Upstream version

| | |
|---|---|
| Project | [storytold/photocraft](https://github.com/storytold/photocraft) |
| Release | [v0.9.0](https://github.com/storytold/photocraft/releases/tag/v0.9.0) (published 2026-10-14 16:36 UTC) |
| Commit | `c699e3cda69f4852b43c0b191ab0091aaeff9d6a` |
| Web archive | `photocraft-web-0.9.0.zip`, 11,467,035 bytes |
| Served at | `https://photocraft.digital/vendor/photocraft/0.9.0/` (embedded by `/editor/`) |

These hashes are for **v0.9.0**, the version deployed when this was written. They will be
regenerated, and a new patch published under `patches/v0.10.0/`, when the site moves to a
newer release.

## What the patch changes

Only the upstream promotional links are removed from the web editor:

| Where | Upstream v0.9.0 | photocraft.digital |
|---|---|---|
| Welcome screen | Discord button, then the link row "PhotoCraft website · GitHub · ArtCraft" | Neither is drawn |
| About window | Discord button and the same link row | Neither is drawn |
| Title bar | Discord button (when the window is wide enough) | Never drawn |

Everything else in the editor is upstream as shipped: tools, file handling, rendering,
the menus and their entries, translations, licenses and the JavaScript glue.

Technically, upstream publishes compiled WebAssembly, so the change is a binary patch of
`photocraft-web-4cc0a6fe355463b6_bg.wasm`:

- Three exact, stack-balanced instruction blocks are overwritten with WebAssembly `nop`
  (0x01). In the title-bar block the width condition becomes `i32.const 1`, so the block is
  always skipped. Offsets and byte signatures are in [`patches/v0.9.0/patch.json`](patches/v0.9.0/patch.json);
  the source-level explanation is in [`patches/v0.9.0/editor-links.md`](patches/v0.9.0/editor-links.md).
- File size, function indices, memory layout and section lengths are unchanged; 108 bytes
  differ. The result passes `WebAssembly.validate`.
- `index.html` changes only in the SHA-384 `integrity` of the `.wasm` preload link, which
  is updated to match the patched file.
- The patch refuses to run on any input whose SHA-256 or byte signatures differ from the
  pinned upstream release.

## Reproduce

Requirements: `curl`, `unzip`, Node.js 18 or newer, and `sha256sum` or `shasum`.

```sh
git clone https://github.com/JQM136/photocraft-digital-patches
cd photocraft-digital-patches
./scripts/reproduce.sh 0.9.0     # download upstream, verify, patch, compare
./scripts/verify-live.sh 0.9.0   # compare with what photocraft.digital serves now
```

`reproduce.sh` downloads the release archive from GitHub, checks its SHA-256, extracts it
under `work/`, and runs [`scripts/apply-patch.mjs`](scripts/apply-patch.mjs). That script
prints `OK` for each output that matches the table below. `verify-live.sh` downloads the
served files and checks them against
[`manifests/v0.9.0.served.sha256`](manifests/v0.9.0.served.sha256).

## SHA-256: upstream inputs and served outputs

| File | Upstream v0.9.0 | Served by photocraft.digital | Changed |
|---|---|---|---|
| `photocraft-web-0.9.0.zip` | `b3fa5ab6a9d32bc5ff7dfdde31939a2337471a196a2e70f1ff961a61b1bb02e6` | not served | n/a |
| `photocraft-web-4cc0a6fe355463b6_bg.wasm` | `5d2e3b7254f478e8b5f09ef23e96f08651da2a9ee59c9f904a08515f4b77fa0b` | `92ab30e3e586af8b30e29a2af98da67afb278072ebb53939f6468c74779dea9b` | **yes** (patched) |
| `index.html` | `fa06712b037be9140457248a205b2c5c74a15a0f79a1a0b9abf036ac3fe8e0d7` | `a932800473bb3ab944269e554add7b119cd249e777c24bfd75f9989a6ac29901` | **yes** (integrity only) |
| `photocraft-web-4cc0a6fe355463b6.js` | `83135ae3724d9a8d9dfdaa37f45058a67bffb4c5a333d4a581191a312f326b1a` | same | no |
| `LICENSE-MIT` | `1a8f66d8a86b146f5336fa0d4b1186576c8aa98e60823080c85c7811cfd810af` | same | no |
| `LICENSE-APACHE` | `0d542e0c8804e39aa7f37eb00da5a762149dc682d7829451287e11b938e94594` | same | no |

The SHA-384 of the patched `.wasm` (its new `integrity` value) is
`sha384-3NKbHDwJZ2JmtcipyQF138JYis12WTK13j4IVOwmTT28CfauuJgtJx10wTT1G7Jb`.
Hashes of every file in the upstream archive are in
[`manifests/v0.9.0.upstream.sha256`](manifests/v0.9.0.upstream.sha256).

## Desktop installers: unmodified

photocraft.digital mirrors the desktop installers from the upstream GitHub release
**without any change**. Each file is checked against upstream's own
[`SHA256SUMS.txt`](https://github.com/storytold/photocraft/releases/download/v0.9.0/SHA256SUMS.txt)
(copy: [`manifests/v0.9.0.installers.SHA256SUMS.txt`](manifests/v0.9.0.installers.SHA256SUMS.txt))
and served from `https://photocraft.digital/downloads/0.9.0/`.

| File | SHA-256 (upstream = served) |
|---|---|
| `photocraft-0.9.0-windows-x64.msi` | `785c81a5fc78c9b683b0f9e6653c38f95b306a38303f60b391670a9e1ac590d4` |
| `photocraft-0.9.0-windows-arm64.msi` | `98f005f4de27d2412b69cb6866f9c31ac252ea60a951a579ce26696113a75098` |
| `photocraft-0.9.0-windows-x86.msi` | `226892dbc266cea6d338081ec5683de7d5520411fa0da7124225239c4321eca4` |
| `photocraft-0.9.0-windows-x64-portable.zip` | `e87bbe26f84d3c359765b61d128b9cc59f016a995956fe7909b328a97650fc97` |
| `photocraft-0.9.0-windows-arm64-portable.zip` | `2c26983c9acbb3b3197c71a21ca55842cb322937c520ec299613846ae6fe040e` |
| `photocraft-0.9.0-windows-x86-portable.zip` | `184dc700d4a1bc923e854882f18c4bbeb76be3358c48490d641c85779d75d72a` |
| `photocraft-0.9.0-macos-universal.dmg` | `06503eb1c845990e99f8824831cc73b274e2b1dbe4461eb6460dfc9a6008239d` |
| `photocraft-0.9.0-linux-x86_64.AppImage` | `483a9a79200e0c0864bb54cf3faa6a55e2b79c1433dacfcb153d3862e78f32bc` |
| `photocraft-0.9.0-linux-aarch64.AppImage` | `2752b5097e2788cc1ab0c7b410657b1eab790bcc3b576f8749de707282dba9e3` |

To check a download yourself: `sha256sum <file>` (Linux), `shasum -a 256 <file>` (macOS) or
`Get-FileHash <file>` (Windows PowerShell), and compare with upstream's `SHA256SUMS.txt`.

Last verified against the live site: 2026-10-19 17:05 (UTC+8).

## License

PhotoCraft is © 2026 ArtCraft Team and the PhotoCraft contributors, licensed under the
[MIT License](https://github.com/storytold/photocraft/blob/v0.9.0/LICENSE-MIT) or the
[Apache License 2.0](https://github.com/storytold/photocraft/blob/v0.9.0/LICENSE-APACHE), at
your option. The served editor includes upstream's `LICENSE-MIT` and `LICENSE-APACHE` unchanged.
As required by Apache-2.0 §4(b), this repository states that the editor's `.wasm` and
`index.html` were modified, and how.

The scripts and documents in this repository are © 2026 JQM136, licensed under
[MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE), the same terms as upstream. See [NOTICE](NOTICE).

**Trademarks.** The ArtCraft name, wordmark and logos are trademarks of the ArtCraft Team and are
not covered by these licenses ([brand policy](https://github.com/storytold/photocraft/blob/v0.9.0/docs/brand/LICENSE-brand.txt)).
This repository contains no ArtCraft brand files and uses the name only in plain text to
credit upstream. photocraft.digital is not called ArtCraft and is not an ArtCraft product.

## Contact

Questions, corrections or takedown requests:
[open an issue](https://github.com/JQM136/photocraft-digital-patches/issues).
Problems with PhotoCraft itself belong
[upstream](https://github.com/storytold/photocraft/issues), but please don't report issues
caused by this modified build there.
