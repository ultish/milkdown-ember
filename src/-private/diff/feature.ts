import { diffComponent } from '@milkdown/kit/component/diff';
import { diff } from '@milkdown/kit/plugin/diff';

import { diffToggleCtx } from './toggle-ctx.ts';

import type { DiffToggleConfig } from './types.ts';
import type { Editor } from '@milkdown/kit/core';

/// Registers Milkdown's own diff-review plugin and its decoration
/// component (`milkdown-diff-added` / `milkdown-diff-removed` CSS
/// classes, headless by construction) onto a not-yet-created Crepe
/// editor. Call before `crepe.create()`. Driving it (starting/accepting/
/// clearing a review) happens later through crepe-sync-manager.ts, using
/// the commands `diff`/`diffComponent` already bundle: `startDiffReviewCmd`,
/// `acceptAllDiffsCmd`, `clearDiffReviewCmd`.
export function registerDiffFeature(
  editor: Editor,
  toggle: DiffToggleConfig,
): void {
  editor
    .config((ctx) => {
      ctx.set(diffToggleCtx.key, toggle);
    })
    .use(diffToggleCtx)
    .use(diff)
    .use(diffComponent);
}
