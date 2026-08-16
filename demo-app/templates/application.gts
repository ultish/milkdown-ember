import { pageTitle } from 'ember-page-title';

import EditorPlayground from '../components/editor-playground.gts';

<template>
  {{pageTitle "milkdown-ember"}}

  <div class="mx-auto max-w-3xl px-6 py-14 space-y-16">
    <header>
      <h1 class="text-3xl font-semibold tracking-tight mb-3">
        milkdown-ember
      </h1>
      <p class="text-base leading-relaxed opacity-70">
        An Ember wrapper around
        <a href="https://milkdown.dev" class="underline">Milkdown's Crepe editor</a>.
        Headless: every example below uses the exact same
        <code>&lt;MilkdownEditor&gt;</code>, styled three different ways. Type
        <code>@</code>
        to mention someone, toggle the toolbar mode, or open the diff review to
        try all four subsystems.
      </p>
    </header>

    <section class="plain-demo space-y-3">
      <h2 class="text-xl font-semibold tracking-tight">Plain CSS</h2>
      <p class="text-sm opacity-70">
        Hand-written rules, no framework. See
        <code>.plain-demo</code>
        in
        <code>demo-app/styles.css</code>.
      </p>
      <EditorPlayground />
    </section>

    <section class="tailwind-demo space-y-3">
      <h2 class="text-xl font-semibold tracking-tight">Tailwind</h2>
      <p class="text-sm opacity-70">
        Utility classes only, no component library. See
        <code>.tailwind-demo</code>.
      </p>
      <EditorPlayground />
    </section>

    <section class="daisy-demo space-y-3" data-theme="light">
      <h2 class="text-xl font-semibold tracking-tight">DaisyUI</h2>
      <p class="text-sm opacity-70">
        DaisyUI component classes on top of Tailwind. See
        <code>.daisy-demo</code>.
      </p>
      <EditorPlayground />
    </section>
  </div>
</template>
