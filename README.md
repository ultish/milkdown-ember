# milkdown-ember

An Ember wrapper around [Milkdown](https://milkdown.dev)'s Crepe editor. Markdown is
Crepe's native state, so markdown in and markdown out is lossless by construction,
unlike editors built on an HTML-shaped document model where markdown is a lossy export.

- `@mention` — headless, trigger-driven suggestion popover, your search callback
- Diff review — inline (Milkdown's own decoration-based review) or side-by-side
- Swappable toolbar — Crepe's floating selection toolbar or a fixed top bar
- Headless — no visual theme; see [Styling](#styling) for the one structural CSS file it does ship
- GTS / TypeScript types published

## Install

```bash
pnpm add milkdown-ember
```

Peer: `ember-source` >= 6.

## Usage

```gts
import { tracked } from '@glimmer/tracking';
import MilkdownEditor from 'milkdown-ember/components/milkdown-editor';

class Example {
  @tracked value = '# Hello\n\nStart typing.';

  onChange = (markdown) => {
    this.value = markdown;
  };

  <template>
    <MilkdownEditor @value={{this.value}} @onChange={{this.onChange}} />
  </template>
}
```

`@value` / `@onChange` behave like a controlled input: whatever `onChange` hands you has
to flow back into `@value` unchanged, or every keystroke gets misread as an external push
and the editor's content gets replaced out from under the cursor on every character typed.
If you transform the markdown before storing it, store the raw value and derive the
transform separately.

## Args

| Arg | Type | Default | |
|---|---|---|---|
| `@value` | `string` | `''` | The document, as markdown |
| `@onChange` | `(markdown: string) => void` | | Fires after Milkdown's own listener plugin settles (debounced ~200ms internally) |
| `@toolbar` | `"floating" \| "static"` | `"floating"` | Crepe's selection toolbar, or a fixed top bar. Switching modes destroys and recreates the editor (seeded from the current content), so it's meant as a setup choice, not a per-keystroke toggle — undo history doesn't survive the swap |
| `@onMentionSearch` | `(query: string) => MentionCandidate[] \| Promise<MentionCandidate[]>` | | Enables `@mention` when provided. Omit it and the mention plugin isn't registered at all |
| `@mentionTrigger` | `string` | `"@"` | The trigger character |
| `@compareValue` | `string` | | The markdown to diff `@value` against. Enables diff review when provided |
| `@diffMode` | `"inline" \| "sideBySide"` | `"inline"` | |
| `@showDiff` | `boolean` | `false` | Controlled, like `@value` |
| `@onShowDiffChange` | `(show: boolean) => void` | | The toolbar's diff button calls this rather than toggling the review directly, so it and any other control you add never disagree about the current state |

## @mention

```gts
<MilkdownEditor
  @value={{this.value}}
  @onChange={{this.onChange}}
  @onMentionSearch={{this.searchUsers}}
/>
```

```js
searchUsers = (query) => {
  return this.users
    .filter((u) => u.label.toLowerCase().includes(query.toLowerCase()))
    .map((u) => ({ id: u.id, label: u.name }));
};
```

A candidate needs only `{ id, label }`. `id` should be stable — it's what round-trips
through markdown, `label` is just display text and can change without breaking anything
already inserted.

A mention is stored as a markdown link with a `mention:` URL scheme, e.g.
`[@Ada Lovelace](mention:u1)`, not a bespoke `@word` syntax. That means it reuses
markdown's own, already-universal link parsing rather than a custom grammar only this
addon understands, and it degrades gracefully: opened in any plain markdown renderer
(GitHub, Slack, a plain-text viewer), it still reads as a link with the person's name
instead of raw unparsed syntax.

Keyboard: Arrow Up/Down to move the selection, Enter or Tab to select, Escape to dismiss.
Candidates are also clickable.

## Diff review

```gts
<MilkdownEditor
  @value={{this.value}}
  @onChange={{this.onChange}}
  @compareValue={{this.previousVersion}}
  @showDiff={{this.showDiff}}
  @diffMode="inline"
  @onShowDiffChange={{this.setShowDiff}}
/>
```

**Inline** drives Milkdown's own diff-review plugin: insertions and deletions render as
decorations inside the live editor, with per-change accept/reject controls. Content
changes from outside (a pushed `@value` update) are filtered out by Milkdown itself for
as long as a review is active — that's upstream behavior, not a bug in this wrapper, it
exists so content can't shift under an active review.

**Side-by-side** renders two independent, read-only panes instead — Milkdown's
decoration-based review only operates on a single live document, there's no code path for
comparing two separate versions inline. Highlighting is block-level (paragraph, heading,
list item, ...), not word-level: the two panes are unaligned renders with no shared
position space to hang finer-grained decorations on.

## Styling

The addon ships **no visual theme** — no colors, no fonts, no layout opinions. It does
ship one small **structural** CSS file, `milkdown-ember/styles/chrome.css`, and importing
it is effectively required, not optional:

```css
@import 'milkdown-ember/styles/chrome.css';
```

Here's the gotcha it exists to solve. **Crepe mounts several of its own floating widgets
unconditionally** — the selection toolbar, the block-edit drag handle and slash menu,
link preview/edit tooltips, the inline math editor — and without *some* baseline CSS they
don't just look unstyled, they render as permanent, stacked, overlapping blocks that push
your page apart and can even swallow clicks meant for a different widget sitting at the
same position. This isn't specific to any one of the three examples below, every consumer
hits it. All seven of them (plus this addon's own mention popover) go through one of
Milkdown's Provider classes and share one convention — hidden unless `data-show="true"`,
positioned absolutely — which is exactly what `chrome.css` provides. `.milkdown-top-bar`
is the one Crepe widget that convention doesn't cover: it manages its own visibility via
an inline style instead, so there's nothing for `chrome.css` to do for it.

If you write your own rule targeting `.milkdown-toolbar` or `.milkdown-block-handle`,
don't redeclare `display` on it unless you also condition it on `[data-show="true"]` — a
more specific selector than `chrome.css`'s own will otherwise win on specificity and
silently make the widget permanently visible again, regardless of the actual
`data-show` value. (This shipped in this addon's own demo app once already.)

From there, style the hooks the addon and Crepe expose:

| Selector | What |
|---|---|
| `[data-milkdown-ember-editor]` | The editor's root element |
| `[data-toolbar="floating"\|"static"]` | On the same root, reflects the current `@toolbar` |
| `.milkdown-toolbar` / `.milkdown-top-bar` | Crepe's own chrome |
| `.toolbar-item` / `.toolbar-item.active` | Individual toolbar buttons |
| `.milkdown-block-handle` | The drag handle; each icon is an `.operation-item`, `.active` is the pressed state |
| `.milkdown-slash-menu` | The "+" block-insert menu — `.tab-group li.selected`, `li[data-index].hover` |
| `[data-milkdown-ember-mention-popover]` | The mention suggestion popover |
| `[data-mention-candidate]` / `[data-active]` | Candidate rows / the keyboard-highlighted one |
| `.milkdown-diff-added` / `.milkdown-diff-removed` | Inline diff decorations |
| `.milkdown-diff-accept` / `.milkdown-diff-reject` | Per-change controls |
| `[data-milkdown-ember-diff-side-by-side]` | Side-by-side container |
| `[data-diff-pane="old"\|"new"]` | Each pane |
| `[data-diff-block]` / `[data-diff-status="changed"\|"unchanged"]` | Blocks within a pane |

The demo app (`pnpm start`, or the deployed GitHub Pages build) shows all of this styled
three ways — plain CSS, Tailwind, and DaisyUI — using the exact same `<MilkdownEditor>`
usage each time, with a live `@mention` search, a toolbar toggle, and both diff modes
wired up. `demo-app/styles.css` is the reference implementation of everything in this
section.

## Compatibility

Ember 6+. Integration tests run in real Chrome and Firefox (Testem), not jsdom —
ProseMirror's contenteditable behavior isn't reliably testable outside a real browser.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

MIT
