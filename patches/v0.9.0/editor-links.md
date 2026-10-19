# v0.9.0: remove promotion rows from the web editor

Customization id: `remove-promotion-rows-v2`.

## Upstream source (tag v0.9.0, commit c699e3cda69f4852b43c0b191ab0091aaeff9d6a)

- `crates/ui-egui/src/links.rs`: the shared promotional controls, `discord_button` and
  `link_row` ("PhotoCraft website · GitHub · ArtCraft").
- `crates/ui-egui/src/canvas.rs`, the `start_screen` closure: `add_space(26.0)`,
  `links::discord_button`, `add_space(10.0)`, `links::link_row`.
- The About window closure: its Discord button and project link row.
- The title bar: the Discord button, drawn only when enough width is available.

## Binary change

The upstream release ships only compiled WebAssembly, so the change is applied to
`photocraft-web-4cc0a6fe355463b6_bg.wasm` rather than rebuilt from source:

| # | Where | Offset | Bytes | Change |
|---|---|---|---|---|
| 1 | Title-bar Discord button | 5,688,979 | 12 | Width condition replaced by `i32.const 1` + `nop`, so the button's block is always skipped |
| 2 | Welcome screen | 6,880,716 | 56 | Spacing, Discord button and link row replaced by `nop` (0x01) |
| 3 | About window | 19,391,876 | 49 | Discord button and link row replaced by `nop` (0x01) |

Each block is a complete, stack-balanced instruction sequence, so replacing it with `nop`
keeps the module valid. Function indices, the memory layout and every section length
are unchanged; the file size stays 25,033,027 bytes. 108 bytes differ in total (some
bytes in the blocks were already 0x01). `scripts/apply-patch.mjs` checks the input
SHA-256 and every byte signature before writing, and runs `WebAssembly.validate` after.

`index.html` changes in one place: the `integrity` (SHA-384) of the `.wasm` preload link
is set to the digest of the patched file, so the browser accepts it.

Nothing else is changed. The JavaScript glue, licenses and all other files are served
byte-identical to the upstream archive.
