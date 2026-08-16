import { pageTitle } from 'ember-page-title';
import { LinkTo } from '@ember/routing';

import MilkdownEditor from '#src/components/milkdown-editor.gts';

import welcomeMd from '../welcome.md?raw';

<template>
  {{pageTitle "milkdown-ember"}}

  <div class="mx-auto max-w-3xl px-6 py-14 space-y-8">
    <header class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl font-semibold tracking-tight">
        milkdown-ember
      </h1>
      <LinkTo
        @route="cookbook"
        class="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
      >Cookbook</LinkTo>
    </header>

    <p class="text-base leading-relaxed opacity-70">
      An Ember wrapper around
      <a href="https://milkdown.dev" class="underline">Milkdown's Crepe editor</a>.
      The editor below has zero extra CSS beyond what the addon itself ships:
      <code>chrome.css</code>
      for structure and the optional
      <code>theme.css</code>
      for looks. The
      <LinkTo @route="cookbook" class="underline">Cookbook</LinkTo>
      shows the same editor restyled with Tailwind and DaisyUI, plus a live
      <code>@mention</code>, toolbar and diff walkthrough.
    </p>

    <MilkdownEditor @value={{welcomeMd}} />
  </div>
</template>
