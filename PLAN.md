# Ember v2 Addon Wrapping Milkdown Crepe

Scaffold a greenfield Ember v2 addon (GTS, Vite, pnpm) that wraps `@milkdown/crepe`, the
batteries-included preset of the Milkdown markdown editor. Markdown is Crepe's native
state, so markdown in and markdown out is lossless by construction, unlike editors built
on an HTML-shaped doc model (Tiptap, Lexical) where markdown is a lossy export.

Package name: **`milkdown-ember`**. Sibling to `floating-ember`, same tooling shape.

## Why this approach

Modern Ember has no good markdown WYSIWYG editor addon. Milkdown's core is
framework-agnostic (`Crepe` is a plain class, `create()`/`destroy()`/`on()`), so it wraps
cleanly, unlike React-only options (Plate, BlockNote) whose plugin architecture is woven
into React's render cycle and would need a rewrite rather than a wrap.

Reference precedent: `floating-ember` for tooling shape (`@ember/addon-blueprint`,
single-package `src/` + `tests/` + `demo-app/`, Vite + Rollup, Testem in real Chrome and
Firefox, `.github/workflows/{ci,pages,release,push-dist}.yml`, headless styling with demo
examples in plain CSS / Tailwind / DaisyUI). Do not copy its product code, only its shape.

## Key decisions

| Decision | Choice | Why |
|---|---|---|
| Editor core | `@milkdown/crepe` | Batteries-included Milkdown preset, markdown-native state, 6 built-in themes we don't ship |
| Component model | Uncontrolled | Crepe owns keystroke-level state; we sync outward via `onChange`, never re-render Crepe on every Ember tracked-property change |
| Modifier base | Class-based `Modifier` (ember-modifier), not the `modifier()` function helper | The function helper tears down and rebuilds on every tracked-arg change; a class-based `modify()` hook reruns without destroying the instance, which we need for the anti-loop guard below |
| Anti-loop guard | Private `#lastKnownMarkdown` field compared against incoming `@value` on every `modify()` call | A boolean re-entrancy flag doesn't work: Ember batches tracked-property propagation, so a flag set-and-cleared around the write is already reset by the time `modify()` reruns. Value comparison is timing-independent |
| External value sync | `replaceAll` from `@milkdown/kit/utils`, upgraded to patch only the changed ranges via `computeDocDiff` (`@milkdown/plugin-diff`) instead of a full-document replace | Full replace resets selection unconditionally; a minimal patch preserves cursor position outside the changed region. Real-time collaborative merging (cursor survives edits *inside* the changed region) is out of scope, that needs OT/CRDT |
| Toolbar swap | `@toolbar="floating"` / `"static"` maps to Crepe's own `Toolbar` vs `TopBar` feature flags | Crepe already ships both: `Toolbar` is the default selection-triggered bar, `TopBar` (opt-in, off by default) is a fixed bar with heading selector, bold/italic/strikethrough/code, lists, link/image/table, code-block/math, quote/hr. Confirmed by reading `packages/crepe/src/feature/{toolbar,top-bar}` in the cloned source, not assumed |
| Toolbar swap cost | Destroy and recreate the Crepe instance, reseeded from `getMarkdown()` | Crepe only reads feature flags at construction time; no live-toggle API exists. Disclosed cost: cursor position and undo history do not survive a toolbar-mode swap. Acceptable since toolbar mode is a deliberate setup choice, not a per-keystroke toggle |
| Diff view engine | `@milkdown/plugin-diff` + `@milkdown/components/diff`, not a custom jsdiff integration | Milkdown ships a structural diff that runs on the parsed ProseMirror document, not raw markdown text, so it doesn't trip on markdown serialization/escaping quirks a naive text diff would. `components/diff` renders insert/delete decorations via plain CSS classes (`milkdown-diff-*`), which is headless by construction, we style the classes, we ship none |
| Diff view: inline mode | Drive `startDiffReviewCmd` / `acceptAllDiffsCmd` / `clearDiffReviewCmd` directly | These are Crepe's own commands, already do exactly what we need: parse a target markdown string, diff it against the live doc, render inline, accept/reject per chunk or all |
| Diff view: side-by-side mode | Two read-only panes, driven by the same `computeDocDiff` output the inline mode uses | One diff engine, two renderers, instead of maintaining a second bespoke diff implementation |
| @mention | Custom plugin: remark syntax extension + ProseMirror node + suggestion popover, headless behind a search callback | No official Milkdown plugin exists. The one community option (`milkdown-mentions-plugin`, 10 stars, last pushed April 2024) is unmaintained and renders its own opinionated link styling, which fights the headless requirement directly |
| Styling | Headless core, zero bundled CSS (no Crepe theme, no Tailwind, no DaisyUI in the addon itself) | Matches `floating-ember`'s precedent exactly. Demo app shows plain CSS, Tailwind, and DaisyUI usage examples |
| Repo/publish scope this pass | Local only | `git init` locally, scaffold the same CI/release/pages workflow shapes as `floating-ember`, do not create/push a GitHub repo, do not wire up npm trusted publishing |

## The editor wrapper: sync contract in detail

This is the part most likely to be gotten wrong, so it's worth being explicit.

**Typing path.** User types → Crepe's `listener` plugin fires `markdownUpdated` → we set
`#lastKnownMarkdown = markdown`, then call `args.onChange(markdown)` → consumer's tracked
property updates → `@value` changes → `modify()` reruns → compares `named.value` against
`#lastKnownMarkdown` → equal → no-op. This is what breaks the loop and what stops every
keystroke from also triggering a content replace on the return trip.

**Consumer contract.** Whatever `onChange` hands the consumer must flow back into `@value`
unchanged. If a consumer transforms the string before storing it, `@value` will
permanently disagree with `#lastKnownMarkdown` on every keystroke, and the wrapper will
treat every character typed as an external push, replacing content and jumping the cursor
continuously. Document this next to the `@value`/`@onChange` args, not just in prose.

**External push path.** Something outside the editor sets `@value` directly (e.g. a
websocket update, a "load draft" action) → `modify()` reruns → `named.value !==
#lastKnownMarkdown` → genuine external change → apply via a `computeDocDiff`-based minimal
patch (fall back to plain `replaceAll` if the diff plugin isn't registered on this
instance) → update `#lastKnownMarkdown` before the listener has a chance to fire, so the
listener's own `markdownUpdated` call sees a value that already matches and doesn't cause
a second unnecessary `onChange` round-trip.

**Explicitly out of scope:** real-time collaborative merging. If the external push
overlaps the exact region someone is actively typing in, the cursor still jumps. That
needs OT/CRDT-style merging, a materially different feature.

## Definition of done

- `pnpm lint`, `pnpm test` (Testem, real Chrome + Firefox, no jsdom/happy-dom), and
  `pnpm build` all pass.
- Demo app exercises all four subsystems (editor sync, toolbar swap, mention, diff view)
  under plain CSS, Tailwind, and DaisyUI styling.
- GitHub workflow files exist and are valid, not exercised (no remote yet).
- Public API ships typed `.d.ts` via the blueprint's `declarations/` + `tsconfig.publish.json`
  pattern, same as `floating-ember`.

## Phases

Riskiest-unknown-first. Each phase gets a real-browser integration test before the next
phase starts.

1. **Scaffold.** `@ember/addon-blueprint`, name `milkdown-ember`, add `@milkdown/crepe` as
   a dependency. Verify: `pnpm start` shows a blank demo app, `pnpm lint` / `pnpm test`
   pass on the empty scaffold.
2. **Core editor wrapper.** Class-based `Modifier` + component per the sync contract
   above. Verify: type text, assert `onChange` fires with the typed markdown; set `@value`
   externally, assert content updates without stealing focus or resetting the cursor when
   an unrelated re-render happens; assert no `replaceAll` call fires on the onChange
   echo path (spy/count assertion, not just a passing eyeball check).
3. **Toolbar swap.** `@toolbar="floating"` / `"static"` → `CrepeFeature.Toolbar` /
   `CrepeFeature.TopBar`, destroy-and-recreate seeded from `getMarkdown()`. Verify: toggle
   the arg, assert the correct chrome appears/disappears and content survives the swap.
4. **@mention plugin.** Remark syntax extension + ProseMirror node + suggestion popover,
   headless search callback, configurable trigger character. One short architect pass on
   the node schema and callback shape before implementation, this is the one subsystem
   with no library precedent to lean on. Verify: type the trigger character, type a query,
   assert the popover renders results from a fake callback, select one, assert the node
   round-trips correctly through `getMarkdown()` and back through `replaceAll()`.
5. **Diff view.** Register `plugin-diff` + `components/diff` on the Crepe instance.
   Inline mode via `startDiffReviewCmd` / `acceptAllDiffsCmd` / `clearDiffReviewCmd` behind
   a toolbar button (visible when `@compareValue` is set) or an exposed action.
   Side-by-side mode as two read-only panes sharing the same `computeDocDiff` output.
   Verify: supply `@value` / `@compareValue`, toggle diff, assert insert/delete decoration
   classes appear (inline) or both panes render with highlighted changed ranges
   (side-by-side); accept-all, assert editor content matches `@compareValue`.
6. **Demo app.** Plain CSS, Tailwind, and DaisyUI examples, each exercising all four
   subsystems.
7. **GitHub workflows.** Adapt `floating-ember`'s `ci.yml` / `pages.yml` / `release.yml` /
   `push-dist.yml` shapes, package and repo names swapped, npm publish scaffolded but not
   wired up.
8. **README + `pnpm lint:publish`.**

## Not in this pass

Live Google-Docs-style track-changes (collaborative suggestions), bundled visual themes,
actually creating the GitHub repo, publishing to npm, real-time collaborative merging of
external pushes into an actively-edited cursor position.
