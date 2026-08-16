import { waitForPromise } from '@ember/test-waiters';
import { Editor, parserCtx, rootCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';

import { mentionSchema } from '../mention/schema.ts';

import type { Node as ProseNode } from '@milkdown/kit/prose/model';

/// A headless, detached Milkdown editor used only to parse markdown
/// strings into ProseMirror docs for the side-by-side diff view. Never
/// attached to the visible DOM, never edited. Exists because `parserCtx`
/// (and correct parsing of the mention node) is only reachable through a
/// real Editor instance, there's no standalone "just parse this" function.
/// Independent of any live CrepeSyncManager: side-by-side renders a
/// snapshot comparison, it doesn't need the live editor's exact plugin
/// set, only the same schema (commonmark + gfm + mention, matching what
/// CrepeBuilder itself always registers).
export class DiffParser {
  #editor: Editor;
  #ready: Promise<void>;

  constructor() {
    const detachedRoot = document.createElement('div');
    this.#editor = Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, detachedRoot);
      })
      .use(commonmark)
      .use(gfm)
      .use(mentionSchema);

    this.#ready = waitForPromise(
      this.#editor.create().then(() => undefined),
      'milkdown-ember:diff-parser-create',
    );
  }

  async parse(markdown: string): Promise<ProseNode | undefined> {
    await this.#ready;
    let result: ProseNode | undefined;
    this.#editor.action((ctx) => {
      const parser = ctx.get(parserCtx);
      result = parser(markdown) ?? undefined;
    });
    return result;
  }

  async destroy(): Promise<void> {
    await this.#ready.catch(() => undefined);
    await this.#editor.destroy();
  }
}
