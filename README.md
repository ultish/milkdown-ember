# milkdown-ember

An Ember wrapper around [Milkdown](https://milkdown.dev)'s Crepe editor. Markdown is
Crepe's native state, so markdown in and markdown out is lossless by construction,
unlike editors built on an HTML-shaped document model where markdown is a lossy export.

- `@mention` — headless, trigger-driven suggestion popover, your search callback
- Diff review — inline (Milkdown's own decoration-based review) or side-by-side
- Swappable toolbar — Crepe's floating selection toolbar or a fixed top bar
- Two stylesheets — a required structural one, plus an optional default theme you re-skin with custom properties; see [Styling](#styling)
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
| `@blockHandle` | `boolean` | `true` | The per-block `+` / drag-handle gutter (`.milkdown-block-handle`). Set to `false` to disable it entirely. Like `@toolbar`, changing this destroys and recreates the editor. This addon also doubles Crepe's own default handle offset (16px → 32px): at 16px, the handle (~3.6rem wide) has nowhere to go but past the editor's edge unless the editor carves out padding specifically for it, which Crepe's own theme does (120px) but a typical modest padding doesn't — 32px gives it a lane in the page's own margin instead |
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

The addon ships two stylesheets, kept separate on purpose.

`milkdown-ember/styles/chrome.css` is **structural** — positioning, show/hide, and
upstream base CSS, with no colors, fonts, or layout opinions of its own. Importing it is
effectively required, not optional: without it several Crepe features aren't merely
unstyled, they're broken.

`milkdown-ember/styles/theme.css` is a **minimal default visual theme**, and importing it
is genuinely optional. It exists so you can have a decent-looking editor without writing
any CSS at all. Leave it out and style the hooks yourself if you want your own look.

```css
@import 'milkdown-ember/styles/chrome.css';
@import 'milkdown-ember/styles/theme.css'; /* optional, and after chrome.css */
```

Order matters for the second one: a few of its selectors tie chrome.css's on specificity,
and a tie is settled by source order.

`chrome.css` covers seven unrelated gaps, in the order they appear in the file:

**0. Upstream base CSS.** Three of this addon's dependencies ship required CSS as a
sibling file for the consumer to import themselves — same convention Crepe's own theme
files follow, so nothing pulls any of it in automatically, and this headless addon never
had. `prosemirror-view`'s base CSS is inlined directly (most importantly `.ProseMirror {
position: relative }` — without it, everything that positions itself `absolute` inside
the editor, which is most of what's below, renders relative to whatever positioned
ancestor happens to exist further up your page instead, typically nowhere near the
visible editor). `@milkdown/kit/prose/tables/style/tables.css` and
`katex/dist/katex.min.css` are plain `@import`s: without the first, table columns ignore
their assigned widths and the resize handle has nowhere to render; without the second,
inline and block math (`CrepeFeature.Latex`, on by default) renders as a garbled run of
raw HTML instead of typeset notation, since it's KaTeX's own CSS — including its math
`@font-face` declarations — that turns its output into something readable. `katex` is
now a direct dependency of this addon specifically so that import resolves.

**1. Crepe's own floating widgets.** They mount into the DOM unconditionally and default
to `display: block`, so without *some* baseline CSS they don't just look unstyled, they
render as permanent, stacked, overlapping blocks that push your page apart and can even
swallow clicks meant for a different widget sitting at the same position. This isn't
specific to any one of the three examples below, every consumer hits it. Ten of them
share one convention — hidden unless `data-show="true"`, positioned absolutely — which
is exactly what `chrome.css` provides: the selection toolbar, the block-edit drag handle
and slash menu, link preview/edit tooltips, the inline math editor, this addon's own
mention popover, the table block's drag preview and per-handle button group, and the AI
diff feature's action bar (unreachable today — `CrepeFeature.AI` defaults off and this
addon doesn't yet expose a way to turn it on, listed for when it is). `.milkdown-top-bar`
is the one Crepe widget that convention doesn't cover: it manages its own visibility via
an inline style instead, so there's nothing for `chrome.css` to do for it.

If you write your own rule targeting any of these `data-show`-gated widgets, don't
redeclare `display` on it — even via a utility class or component class that happens to
set `display` as a side effect (Tailwind's `flex`, DaisyUI's `join`/`card`) — unless you
also condition it on `[data-show="true"]`. A same-or-higher-specificity selector will
otherwise win regardless of the actual `data-show` value, silently making the widget
permanently visible again. (This shipped in this addon's own demo app twice already —
once for `.milkdown-toolbar`, once for `.milkdown-slash-menu`.)

Two widgets that are each individually gated correctly can still end up positioned at the
same coordinates — the selection toolbar and the link preview/edit tooltip both anchor to
the current selection. `chrome.css` also carries Crepe's own fix for that specific pair
(`.milkdown:has(.milkdown-link-preview[data-show="true"]) .milkdown-toolbar { display:
none }`, and the same for `.milkdown-link-edit`): without it, both are "shown" at once and
the later one in DOM order (the toolbar) paints over the link widget, the same
swallowed-click failure mode described above.

**2. The Cursor feature** (on by default) replaces the browser's native caret with a
virtual one, a gap cursor (for selections between blocks), and a drag/drop indicator
line. Each is shipped by a different upstream package whose own CSS Crepe's full theme
imports but this headless addon never did. Without it: the native caret goes invisible
(the plugin sets `caret-color: transparent` on it, expecting its virtual replacement to
render in its place — and that replacement depends on Category 0's `position: relative`
fix above to render in the right spot at all), the gap cursor never appears (same
`display: none`-until-focused gate as the floating widgets above, just from a different
package), and dragging a block shows no drop-position indicator at all (it renders with
no color by default). The one and only two colors `chrome.css` sets —
`.prosemirror-virtual-cursor`'s `border-left` and `.crepe-drop-cursor`'s
`background-color` — both default to `currentColor`, a zero-color choice, not a theme
one; override `--prosemirror-virtual-cursor-color` or add your own rule for either
selector to theme them.

**3. The Placeholder feature** (on by default, default text "Please enter...") marks the
empty block nearest the selection with a `data-placeholder` attribute, expecting a
`::before` rule with `content: attr(data-placeholder)` to draw it — without that rule
this isn't unstyled, it's a dead feature, since nothing ever reads the attribute.
`chrome.css` wires up the `content`, `position: absolute`, and `height: 0` (so the ghost
text doesn't push real content down while empty), and dims it with `opacity: 0.5` — a
zero-color choice for the same reason `currentColor` is used elsewhere, since placeholder
text needs *some* visual distinction from real content or it reads as data loss. Override
`.crepe-placeholder::before`'s `opacity` or add a `color` to theme it.

Separately from the CSS: this addon configures the feature with `mode: 'doc'` rather than
Crepe's own default of `mode: 'block'`. Block mode shows the placeholder on *every* empty
paragraph you land the cursor in, Notion-style; this addon wraps a single markdown value,
closer to a `<textarea>` than a multi-section document, so the placeholder only shows
while the whole document is empty, not on every blank line you create while editing
non-empty content.

**4. A `.hidden` utility** the Image Block feature (on by default) uses to swap between
its "paste a link or upload" and "image uploaded" sub-views, and the Code Block feature's
language picker uses the same way. Both are scoped `!important` in Crepe's own theme, so
there's no specificity gotcha the way there is with the `data-show` gates above.

**5. The Code Block feature's own chrome** (on by default). CodeMirror itself needs no
CSS import — it's CSS-in-JS, injecting its own `<style>` tag at runtime, which is why
syntax highlighting works with none of this file's help. What doesn't: `.tools` (the row
holding the language button and the copy button) had no `display: flex`, so the two
stacked on separate lines instead of sitting in a row; `.language-picker` (the language
dropdown) had no `position: absolute`, so opening it pushed the code down and right
instead of floating over it; `.language-list` (the dropdown's item list) had no height
cap or `overflow-y: auto`, the identical bug already described for the "+" menu's
`.menu-groups` above, just in a different feature's copy of the same pattern.

**6. The Image feature's own chrome** (on by default). Crepe ships this one's CSS as its
own sibling theme file too (`@milkdown/crepe/theme/common/image-block.css`, same
convention as Category 0's imports), but `chrome.css` carries a color-stripped copy of it
rather than importing it: every color in that file routes through Crepe's own
`--crepe-color-*` custom properties, which this addon never defines, so importing it
verbatim would silently no-op those declarations against an undefined custom property.
Without the rules that are left, the inline "paste a link or upload" widget has no layout
at all, the block image's caption/edit panel doesn't lay out as a row, and — the bug this
was written for — the hover-revealed caption/delete/upload icons and the drag-to-resize
handle along the image's bottom edge have no `position: absolute`, so they render in
normal document flow above the image instead of floating over its corner and edge.

### theme.css, and re-theming it

Every color, radius, and shadow in `theme.css` is written as
`var(--milkdown-ember-*, fallback)`. Re-theming is therefore a matter of setting custom
properties on whatever scope suits you — `:root`, one wrapper element, a
`prefers-color-scheme` block — instead of writing higher-specificity rules to beat the
ones already there:

```css
/* Re-theme just the code block, leaving everything else alone */
:root {
  --milkdown-ember-code-bg: #f6f8fa;
  --milkdown-ember-code-text: #57606a;
  --milkdown-ember-code-hover: rgb(0 0 0 / 6%);
}

/* Or re-theme the whole chrome at once: the editor's border, the toolbar, the
   block handle, the slash menu, the link popovers and the diff panes all read
   these same three properties */
.my-app-dark {
  --milkdown-ember-border: #2f3336;
  --milkdown-ember-surface: #16181c;
  --milkdown-ember-surface-hover: #22262a;
  --milkdown-ember-text: #e7e9ea;
}

/* Or just soften every corner in the editor */
:root {
  --milkdown-ember-radius: 12px;
  --milkdown-ember-radius-md: 10px;
  --milkdown-ember-radius-sm: 6px;
}
```

Everything `theme.css` sets that isn't in this table — padding, gaps, widths, flex
behavior, cursors — is layout rather than theme, and isn't parameterized.

| Custom property | Fallback | Controls |
|---|---|---|
| `--milkdown-ember-border` | `#ddd` | Every border in the theme: the editor, table cells, a blockquote's left rule, the toolbar and top bar, the block handle, link preview/edit, the slash menu, the diff accept/reject buttons, the diff panes, and the top bar's divider |
| `--milkdown-ember-border-focus` | `#888` | The editor's border while focused (`:focus-within`) |
| `--milkdown-ember-radius` | `8px` | Large corners: the editor, the slash menu, a side-by-side diff pane |
| `--milkdown-ember-radius-md` | `6px` | Medium corners: the toolbar and top bar, the block handle, the code block, the mention popover, the top bar's heading dropdown |
| `--milkdown-ember-radius-sm` | `4px` | Small corners: every button and menu row, mention candidates, the code block's search box |
| `--milkdown-ember-surface` | `#fff` | Panel background: the toolbar and top bar, the block handle, link preview/edit, the slash menu, the heading dropdown, the language list, the diff accept/reject buttons |
| `--milkdown-ember-surface-hover` | `#f0eee9` | The hovered, active, or selected background on every one of those rows and buttons |
| `--milkdown-ember-text` | `#1c1915` | The editor's body text, and text inside inline diff decorations |
| `--milkdown-ember-text-muted` | `#57534e` | Blockquote text |
| `--milkdown-ember-label-muted` | `#999` | The slash menu's uppercase group labels (`h6`) |
| `--milkdown-ember-divider` | `#eee` | The rule under the slash menu's tab group |
| `--milkdown-ember-shadow` | `0 8px 24px rgb(0 0 0 / 12%)` | Every floating panel's drop shadow: link preview/edit, the slash menu, the heading dropdown, the language list |
| `--milkdown-ember-table-header-bg` | `#f7f6f3` | A table's header row (`th`) |
| `--milkdown-ember-code-bg` | `#282c34` | The code block wrapper, matched to CodeMirror's own default theme background so the two read as one box |
| `--milkdown-ember-code-text` | `#abb2bf` | The code block's language name and copy button |
| `--milkdown-ember-code-hover` | `rgb(255 255 255 / 10%)` | Hover on those two buttons |
| `--milkdown-ember-mention-bg` | `#1c1915` | The mention popover's background |
| `--milkdown-ember-mention-text` | `#f4efe4` | The mention popover's text |
| `--milkdown-ember-mention-active` | `rgb(255 255 255 / 15%)` | The keyboard-highlighted mention candidate |
| `--milkdown-ember-diff-added-bg` | `#e6ffed` | The inline added-text decoration |
| `--milkdown-ember-diff-removed-bg` | `#ffeef0` | The inline removed-text decoration |
| `--milkdown-ember-diff-changed-bg` | `#fff8e1` | A changed block inside a side-by-side pane |
| `--milkdown-ember-image-operation-bg` | `#1c1915` | The circular caption/delete/upload icon chip shown on hover over a block image |
| `--milkdown-ember-image-operation-text` | `#f4efe4` | Those icons' color |
| `--milkdown-ember-font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | The editor's font stack |

If you'd rather build your own look from scratch, skip `theme.css` and style the hooks
the addon and Crepe expose directly:

| Selector | What |
|---|---|
| `[data-milkdown-ember-editor]` | The editor's root element |
| `[data-toolbar="floating"\|"static"]` | On the same root, reflects the current `@toolbar` |
| `.milkdown-toolbar` / `.milkdown-top-bar` | Crepe's own chrome |
| `.toolbar-item` / `.toolbar-item.active` | Buttons in the floating toolbar |
| `.top-bar-inner` | The static top bar's button row — needs its own `display: flex`, the icons/selectors inside it aren't laid out by `.milkdown-top-bar` alone |
| `.top-bar-item` / `.top-bar-item.active` | Buttons in the static top bar — a distinct class from `.toolbar-item` above, not shared with the floating toolbar |
| `.top-bar-heading-selector` / `.top-bar-heading-button` / `.top-bar-heading-dropdown` / `.top-bar-heading-option` | The static top bar's block-type (paragraph/heading) dropdown |
| `.milkdown-block-handle` | The drag handle; each icon is an `.operation-item`, `.active` is the pressed state |
| `.list-item` / `.label-wrapper` / `.children` | A bullet/ordered/task list item — `.list-item` needs `display: flex` itself, its icon and text are two separate block-level divs |
| `.milkdown-slash-menu` | The "+" block-insert menu — `.tab-group li.selected`, `li[data-index].hover` |
| `.milkdown-link-preview` / `.link-preview`, `.link-display`, `.link-icon` | The hover tooltip shown over an existing link |
| `.milkdown-link-edit` / `.link-edit`, `.input-area` | The popover for adding/editing a link's URL; both preview and edit share a `.button` class for their icon buttons |
| `.crepe-placeholder` / `[data-placeholder]` | The empty block nearest the selection, while `CrepeFeature.Placeholder` has no text there yet |
| `.milkdown-table-block table` / `th` / `td` | A table's own borders/background — `chrome.css` only imports `prosemirror-tables`' layout CSS (column sizing, the resize handle), not any visual styling, so a table is a borderless grid without your own rule here |
| `.milkdown-table-block .drag-preview` | The ghost row/column shown while dragging a table row or column handle |
| `.milkdown-table-block .button-group` | The align/delete button row that appears above a selected row/column drag handle |
| `blockquote` | Same story as tables — a plain node with no border/indent styling of its own; not a `chrome.css` concern at all, just a hook worth styling |
| `.milkdown-code-block .tools` / `.language-button` / `.tools-button-group` | The row above a code block holding the language picker and the copy button |
| `.milkdown-code-block .language-picker` / `.list-wrapper` / `.search-box` / `.language-list-item` | The language dropdown itself — `chrome.css` handles its position/scroll, this is the visual layer |
| `.milkdown-image-block` / `.milkdown-image-inline` | A block image and an inline one; `.empty-image-inline` and `.image-edit` are the "paste a link or upload" sub-views each shows before a source is set |
| `.milkdown-image-block .operation` / `.operation-item` | The caption/delete/upload icon chips revealed over a block image's top-right corner on hover — `chrome.css` positions and reveals them, this is the visual layer |
| `.milkdown-image-block .image-resize-handle` / `.caption-input` | The drag-to-resize bar along the image's bottom edge (also `chrome.css`-positioned, `row-resize` on hover), and the caption line under the image |
| `[data-milkdown-ember-mention-popover]` | The mention suggestion popover |
| `[data-mention-candidate]` / `[data-active]` | Candidate rows / the keyboard-highlighted one |
| `.milkdown-diff-added` / `.milkdown-diff-removed` | Inline diff decorations |
| `.milkdown-diff-accept` / `.milkdown-diff-reject` | Per-change controls |
| `[data-milkdown-ember-diff-side-by-side]` | Side-by-side container |
| `[data-diff-pane="old"\|"new"]` | Each pane |
| `[data-diff-block]` / `[data-diff-status="changed"\|"unchanged"]` | Blocks within a pane |
| `.crepe-drop-cursor` | The line shown while dragging a block, indicating where it'll land |
| `--prosemirror-virtual-cursor-color` | The blinking text caret's color (`chrome.css` defaults both this and `.crepe-drop-cursor` to `currentColor`) |

The demo app (`pnpm start`, or the deployed GitHub Pages build) shows both paths side by
side, using the exact same `<MilkdownEditor>` usage each time, with a live `@mention`
search, a toolbar toggle, and both diff modes wired up. Its Plain CSS section imports
`theme.css` and adds nothing else, so it's the proof the shipped theme works out of the
box. Its Tailwind and DaisyUI sections deliberately don't import it — they restate the
same visual rules in their own framework-native syntax over the hooks in the table above,
which is what the from-scratch path looks like. `demo-app/styles.css` is the reference
implementation of both.

## Compatibility

Ember 6+. Integration tests run in real Chrome and Firefox (Testem), not jsdom —
ProseMirror's contenteditable behavior isn't reliably testable outside a real browser.

## Contributing

See the [Contributing](CONTRIBUTING.md) guide for details.

## License

MIT
