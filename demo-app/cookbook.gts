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

const RECIPE_PLAYGROUND = `<MilkdownEditor
  @value={{this.value}}
  @onChange={{this.onChange}}
  @toolbar={{this.toolbar}}
  @blockHandle={{this.blockHandle}}
  @onMentionSearch={{this.onSearch}}
  @compareValue={{this.compareValue}}
  @diffMode={{this.diffMode}}
  @showDiff={{this.showDiff}}
  @onShowDiffChange={{this.onShowDiffChange}}
/>

// See demo-app/components/editor-playground.gts for the full component —
// every section below isolates one of these args.`;

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
   your own rules — theme.css's selectors already apply everywhere */
.my-editor-wrapper {
  --milkdown-ember-border: var(--color-slate-300);
  --milkdown-ember-surface: var(--color-white);
  --milkdown-ember-text: var(--color-slate-900);
  /* ...see demo-app/tailwind-theme.css for the full mapping */
}

<div class="my-editor-wrapper">
  <MilkdownEditor @value={{this.value}} />
</div>`;

const RECIPE_DAISY = `@import 'milkdown-ember/styles/chrome.css';
@import 'milkdown-ember/styles/theme.css';

/* Reskin with DaisyUI's own theme tokens — these are real custom
   properties on [data-theme], not just utility classes, so this follows
   DaisyUI's active theme automatically */
.my-editor-wrapper {
  --milkdown-ember-border: var(--color-base-300);
  --milkdown-ember-surface: var(--color-base-100);
  --milkdown-ember-text: var(--color-base-content);
  /* ...see demo-app/daisy-theme.css for the full mapping */
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
          @blurb="Reskins the shipped theme.css with Tailwind's own generated palette tokens, rather than writing new rules. See demo-app/tailwind-theme.css."
          @code={{RECIPE_TAILWIND}}
          class="tailwind-demo"
        >
          <EditorPlayground />
        </CookbookSection>

        <CookbookSection
          @id="styling-daisy"
          @title="DaisyUI"
          @blurb="Reskins the same theme.css with DaisyUI's own theme tokens, so it follows the active DaisyUI theme. See demo-app/daisy-theme.css."
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
