import { LinkTo } from '@ember/routing';

import CookbookSection from './components/cookbook-section.gts';
import EditorPlayground from './components/editor-playground.gts';

const TOC = [
  { id: 'playground', label: 'Live playground' },
  { id: 'sync', label: 'Sync' },
  { id: 'toolbar', label: 'Toolbar' },
  { id: 'block-handle', label: 'Block handle' },
  { id: 'mention', label: 'Mention' },
  { id: 'diff', label: 'Diff review' },
  { id: 'built-in', label: 'Built-in features' },
  { id: 'styling', label: 'Styling' },
  { id: 'args', label: 'Args reference' },
] as const;

const BUILT_IN = [
  {
    feature: 'Table',
    tryIt: 'pipe syntax; drag a column/row handle to resize',
  },
  {
    feature: 'Code block',
    tryIt: 'fenced blocks; language picker, copy button',
  },
  { feature: 'Math', tryIt: '$inline$ and block math, via KaTeX' },
  { feature: 'Blockquote', tryIt: '> quoted text' },
  {
    feature: 'Image',
    tryIt: '![alt](src "caption"); hover to resize/caption',
  },
] as const;

const ARGS = [
  { arg: 'value', default: '—', meaning: 'Markdown to load into the editor' },
  {
    arg: 'onChange',
    default: '—',
    meaning: '(markdown) => void, fires on every edit',
  },
  { arg: 'toolbar', default: '"floating"', meaning: '"floating" | "static"' },
  {
    arg: 'blockHandle',
    default: 'true',
    meaning: 'Show the +/⋮⋮ block handle',
  },
  {
    arg: 'onMentionSearch',
    default: '—',
    meaning: '(query) => Candidate[], enables @mention',
  },
  {
    arg: 'mentionTrigger',
    default: '"@"',
    meaning: 'Character that opens the mention popover',
  },
  {
    arg: 'compareValue',
    default: '—',
    meaning: '"before" markdown to diff @value against',
  },
  { arg: 'diffMode', default: '"inline"', meaning: '"inline" | "sideBySide"' },
  {
    arg: 'showDiff',
    default: 'false',
    meaning: 'Controlled: is diff review currently showing',
  },
  {
    arg: 'onShowDiffChange',
    default: '—',
    meaning: '(show) => void, fires when diff visibility changes',
  },
] as const;

// Two blurbs live out here as consts: a literal `@blurb="@value ..."` in the
// template trips ember-template-lint's no-potential-path-strings.
const BLURB_SYNC =
  '@value loads markdown in; @onChange fires the current serialization back out on every edit.';

const TITLE_MENTION = '@mention';

const RECIPE_PLAYGROUND = `import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import MilkdownEditor from 'milkdown-ember/components/milkdown-editor';

const USERS = [
  { id: 'u1', label: 'Ada Lovelace' },
  { id: 'u2', label: 'Alan Turing' },
  { id: 'u3', label: 'Grace Hopper' },
  { id: 'u4', label: 'Katherine Johnson' },
];

const INITIAL_VALUE = '# Release notes\\n\\nType @ to mention someone.\\n\\n- [ ] Update the changelog\\n- [ ] Cut the release';
const COMPARE_VALUE = '# Release notes v2\\n\\nType @ to mention someone, a search popup opens.\\n\\n- [x] Update the changelog\\n- [ ] Cut the release\\n- [ ] Announce in #general';

export default class Playground extends Component {
  @tracked value = INITIAL_VALUE;
  @tracked toolbar = 'floating';
  @tracked blockHandle = true;
  @tracked showDiff = false;
  @tracked diffMode = 'inline';

  onSearch = (query) => {
    const q = query.toLowerCase();
    return USERS.filter((u) => u.label.toLowerCase().includes(q));
  };

  onChange = (markdown) => {
    this.value = markdown;
  };

  onShowDiffChange = (show) => {
    this.showDiff = show;
  };

  toggleToolbar = () => {
    this.toolbar = this.toolbar === 'floating' ? 'static' : 'floating';
  };

  toggleBlockHandle = () => {
    this.blockHandle = !this.blockHandle;
  };

  setDiffMode = (mode) => {
    this.diffMode = mode;
    this.showDiff = true;
  };

  hideDiff = () => {
    this.showDiff = false;
  };

  <template>
    <button {{on "click" this.toggleToolbar}}>Toolbar: {{this.toolbar}}</button>
    <button {{on "click" this.toggleBlockHandle}}>Block handle: {{if this.blockHandle "on" "off"}}</button>
    <button {{on "click" (fn this.setDiffMode "inline")}}>Show diff (inline)</button>
    <button {{on "click" (fn this.setDiffMode "sideBySide")}}>Show diff (side by side)</button>
    <button {{on "click" this.hideDiff}}>Hide diff</button>

    <MilkdownEditor
      @value={{this.value}}
      @onChange={{this.onChange}}
      @toolbar={{this.toolbar}}
      @blockHandle={{this.blockHandle}}
      @onMentionSearch={{this.onSearch}}
      @compareValue={{COMPARE_VALUE}}
      @showDiff={{this.showDiff}}
      @diffMode={{this.diffMode}}
      @onShowDiffChange={{this.onShowDiffChange}}
    />
  </template>
}

// Every section below isolates one of these args — this is the assembled whole.`;

const RECIPE_SYNC = `export default class Demo extends Component {
  @tracked value = '# Release notes\\n\\n- [ ] Ship it';

  onChange = (markdown) => {
    this.value = markdown;
  };

  <template>
    <MilkdownEditor @value={{this.value}} @onChange={{this.onChange}} />
  </template>
}

// @value only re-syncs into the editor when it changes from the OUTSIDE —
// typing doesn't fight itself in an echo loop against your own onChange.`;

const RECIPE_TOOLBAR = `<MilkdownEditor @toolbar="floating" /> {{! default: Crepe's selection toolbar }}
<MilkdownEditor @toolbar="static" />   {{! an always-visible top bar instead }}

// Switching @toolbar recreates the underlying Crepe instance, so drive it
// from a tracked property, not from something that changes per keystroke.`;

const RECIPE_BLOCK_HANDLE = `<MilkdownEditor @blockHandle={{true}} />  {{! default }}
<MilkdownEditor @blockHandle={{false}} /> {{! off }}`;

const RECIPE_MENTION = `<MilkdownEditor
  @onMentionSearch={{this.onSearch}}
  @mentionTrigger="@"
/>

onSearch = (query) => {
  return USERS.filter((u) =>
    u.label.toLowerCase().includes(query.toLowerCase())
  );
};

// Type @ (or your own @mentionTrigger) in the playground above to try it.`;

const RECIPE_DIFF = `<MilkdownEditor
  @value={{this.value}}
  @compareValue={{this.compareValue}}
  @diffMode="inline"        {{! or "sideBySide" }}
  @showDiff={{this.showDiff}}
  @onShowDiffChange={{this.onShowDiffChange}}
/>

// diffMode="sideBySide" swaps in a two-pane comparison view; the live
// editor's DOM stays mounted underneath (hidden, not torn down), so
// toggling back doesn't rebuild the Crepe instance.`;

const RECIPE_PLAIN = `@import 'milkdown-ember/styles/chrome.css';
@import 'milkdown-ember/styles/theme.css'; /* optional, after chrome.css */

<MilkdownEditor @value={{this.value}} />

// See the main page — this is exactly what it does.`;

const RECIPE_TAILWIND = `@import 'milkdown-ember/styles/chrome.css';
@import 'milkdown-ember/styles/theme.css';

/* Reskin the shipped theme with Tailwind's own tokens instead of writing
   your own rules — theme.css's selectors already apply everywhere.
   Properties left unset here (radius-sm, the mention/diff/image-operation
   colors, the code-block colors, the shadow) keep their shipped defaults —
   Tailwind has no further semantic token to reach for on top of the slate
   scale already mapped below. */
.my-editor-wrapper {
  --milkdown-ember-border: var(--color-slate-300);
  --milkdown-ember-border-focus: var(--color-slate-500);
  --milkdown-ember-radius: var(--radius-lg);
  --milkdown-ember-radius-md: var(--radius-md);
  --milkdown-ember-surface: var(--color-white);
  --milkdown-ember-surface-hover: var(--color-slate-100);
  --milkdown-ember-text: var(--color-slate-900);
  --milkdown-ember-text-muted: var(--color-slate-600);
  --milkdown-ember-label-muted: var(--color-slate-400);
  --milkdown-ember-divider: var(--color-slate-200);
  --milkdown-ember-table-header-bg: var(--color-slate-50);
}

<div class="my-editor-wrapper">
  <MilkdownEditor @value={{this.value}} />
</div>`;

const RECIPE_DAISY = `@import 'milkdown-ember/styles/chrome.css';
@import 'milkdown-ember/styles/theme.css';

/* Reskin with DaisyUI's own theme tokens — these are real custom
   properties on [data-theme], not just utility classes, so this follows
   DaisyUI's active theme automatically. --milkdown-ember-code-bg/-code-text/
   -code-hover are deliberately left unset: CodeMirror renders its own
   syntax highlighting independently of any DaisyUI theme, so leaving those
   at their shipped default (matched to CodeMirror's own fixed colors) is
   more correct than a second, uncoordinated light/dark toggle. */
.my-editor-wrapper {
  --milkdown-ember-border: var(--color-base-300);
  --milkdown-ember-border-focus: var(--color-primary);
  --milkdown-ember-radius: var(--radius-box);
  --milkdown-ember-radius-md: var(--radius-box);
  --milkdown-ember-radius-sm: var(--radius-field);
  --milkdown-ember-surface: var(--color-base-100);
  --milkdown-ember-surface-hover: var(--color-base-200);
  --milkdown-ember-text: var(--color-base-content);
  --milkdown-ember-text-muted: color-mix(
    in oklab,
    var(--color-base-content) 70%,
    transparent
  );
  --milkdown-ember-label-muted: color-mix(
    in oklab,
    var(--color-base-content) 50%,
    transparent
  );
  --milkdown-ember-divider: var(--color-base-300);
  --milkdown-ember-table-header-bg: var(--color-base-200);
  --milkdown-ember-mention-bg: var(--color-neutral);
  --milkdown-ember-mention-text: var(--color-neutral-content);
  --milkdown-ember-mention-active: color-mix(
    in oklab,
    var(--color-neutral-content) 15%,
    transparent
  );
  --milkdown-ember-diff-added-bg: color-mix(
    in oklab,
    var(--color-success) 15%,
    var(--color-base-100)
  );
  --milkdown-ember-diff-removed-bg: color-mix(
    in oklab,
    var(--color-error) 15%,
    var(--color-base-100)
  );
  --milkdown-ember-diff-changed-bg: color-mix(
    in oklab,
    var(--color-warning) 15%,
    var(--color-base-100)
  );
  --milkdown-ember-image-operation-bg: var(--color-neutral);
  --milkdown-ember-image-operation-text: var(--color-neutral-content);
}

<div class="my-editor-wrapper">
  <MilkdownEditor @value={{this.value}} />
</div>`;

<template>
  <div class="min-h-screen">
    <header
      class="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"
    >
      <div
        class="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-6 py-3"
      >
        <div>
          <p class="text-xs font-medium uppercase tracking-wider opacity-50">
            Cookbook
          </p>
          <LinkTo
            @route="index"
            class="text-lg font-semibold tracking-tight hover:underline"
          >milkdown-ember</LinkTo>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-3xl space-y-12 px-6 py-10">
      <section class="space-y-4">
        <p class="text-base leading-relaxed opacity-70">
          Every recipe below builds on the exact same
          <code>&lt;MilkdownEditor&gt;</code>
          shown on the main page. The Live playground wires up every argument at
          once; each section after it isolates one, with the code to build just
          that.
        </p>
        <nav class="flex flex-wrap gap-2">
          {{#each TOC as |item|}}
            <a
              href="#{{item.id}}"
              class="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50"
            >{{item.label}}</a>
          {{/each}}
        </nav>
      </section>

      <CookbookSection
        @id="playground"
        @title="Live playground"
        @blurb="Every argument below, live in one editor. Flip a control and watch it respond."
        @code={{RECIPE_PLAYGROUND}}
      >
        <EditorPlayground />
      </CookbookSection>

      <CookbookSection
        @id="sync"
        @title="Live sync"
        @blurb={{BLURB_SYNC}}
        @code={{RECIPE_SYNC}}
      />

      <CookbookSection
        @id="toolbar"
        @title="Toolbar: floating or static"
        @blurb="Two ways to show formatting controls. Try the toggle in the playground above."
        @code={{RECIPE_TOOLBAR}}
      />

      <CookbookSection
        @id="block-handle"
        @title="Block handle"
        @blurb="The +/⋮⋮ handle that appears to the left of the block under your cursor — insert a new block, or drag to reorder."
        @code={{RECIPE_BLOCK_HANDLE}}
      />

      <CookbookSection
        @id="mention"
        @title={{TITLE_MENTION}}
        @blurb="Headless: milkdown-ember does no fetching or filtering. onMentionSearch gets the query after the trigger character, you return the candidates."
        @code={{RECIPE_MENTION}}
      />

      <CookbookSection
        @id="diff"
        @title="Diff review"
        @blurb="Compare @value against a @compareValue — inline decorations in the live document, or a read-only side-by-side pane. Try both diff buttons in the playground above."
        @code={{RECIPE_DIFF}}
      />

      <section
        id="built-in"
        class="scroll-mt-24 space-y-3 border-b border-slate-200 pb-10"
      >
        <div class="space-y-1">
          <h2 class="text-xl font-semibold tracking-tight">
            Built in, no args
          </h2>
          <p class="text-sm leading-relaxed opacity-70">
            Tables, fenced code blocks with a language picker, inline/block math
            via KaTeX, blockquotes, and resizable captioned images all ship on
            by default — no argument turns them on. See them live in the welcome
            document on the main page.
          </p>
        </div>
        <div class="overflow-x-auto rounded border border-slate-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="px-4 py-2 font-medium">Feature</th>
                <th class="px-4 py-2 font-medium">Try it</th>
              </tr>
            </thead>
            <tbody>
              {{#each BUILT_IN as |row|}}
                <tr class="border-b border-slate-100 last:border-b-0">
                  <td class="px-4 py-2">{{row.feature}}</td>
                  <td class="px-4 py-2 opacity-70">{{row.tryIt}}</td>
                </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </section>

      <section
        id="styling"
        class="scroll-mt-24 space-y-8 border-b border-slate-200 pb-10"
      >
        <div class="space-y-2">
          <h2 class="text-2xl font-semibold tracking-tight">Styling</h2>
          <p class="text-sm leading-relaxed opacity-70">
            milkdown-ember ships
            <code>chrome.css</code>
            (required) and an optional
            <code>theme.css</code>
            — a minimal default look, entirely
            <code>var(--milkdown-ember-*, fallback)</code>
            custom properties, so re-theming means setting one property instead
            of out-specifying a rule. The main page imports theme.css directly
            and adds nothing else. Below, the exact same theme.css rules
            reskinned two more ways, each by pointing those properties at a
            design system's own tokens.
          </p>
        </div>

        <div id="styling-plain" class="scroll-mt-24 space-y-2">
          <h3 class="text-base font-semibold tracking-tight">Plain CSS</h3>
          <p class="text-sm leading-relaxed opacity-70">
            Import the shipped default and you're done.
          </p>
          <pre
            class="m-0 overflow-x-auto rounded border border-slate-200 bg-slate-100 px-4 py-3 font-mono text-xs leading-relaxed"
          ><code>{{RECIPE_PLAIN}}</code></pre>
        </div>

        <CookbookSection
          @id="styling-tailwind"
          @title="Tailwind"
          @blurb="Reskins the shipped theme.css with Tailwind's own generated palette tokens, rather than writing new rules."
          @code={{RECIPE_TAILWIND}}
          class="tailwind-demo"
        >
          <EditorPlayground />
        </CookbookSection>

        <CookbookSection
          @id="styling-daisy"
          @title="DaisyUI"
          @blurb="Reskins the same theme.css with DaisyUI's own theme tokens, so it follows the active DaisyUI theme."
          @code={{RECIPE_DAISY}}
          class="daisy-demo"
          data-theme="light"
        >
          <EditorPlayground />
        </CookbookSection>
      </section>

      <section id="args" class="scroll-mt-24 space-y-3">
        <h2 class="text-xl font-semibold tracking-tight">Args reference</h2>
        <p class="text-sm leading-relaxed opacity-70">
          Every argument
          <code>&lt;MilkdownEditor&gt;</code>
          accepts. All of them are optional.
        </p>
        <div class="overflow-x-auto rounded border border-slate-200 bg-white">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-slate-200 bg-slate-50">
              <tr>
                <th class="px-4 py-2 font-medium">Arg</th>
                <th class="px-4 py-2 font-medium">Default</th>
                <th class="px-4 py-2 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody>
              {{#each ARGS as |row|}}
                <tr class="border-b border-slate-100 last:border-b-0">
                  <td class="px-4 py-2"><code>{{row.arg}}</code></td>
                  <td class="px-4 py-2 whitespace-nowrap">{{row.default}}</td>
                  <td class="px-4 py-2 opacity-70">{{row.meaning}}</td>
                </tr>
              {{/each}}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>
