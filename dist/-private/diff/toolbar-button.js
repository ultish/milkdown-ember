import { CrepeFeature } from '@milkdown/crepe';
import { editorViewCtx } from '@milkdown/kit/core';
import { diffPluginKey } from '@milkdown/kit/plugin/diff';
import { diffToggleCtx } from './toggle-ctx.js';

/// `ToolbarFeatureConfig`/`TopBarFeatureConfig`/`GroupBuilder`/`ToolbarItem`
/// are real types in Crepe's source but aren't part of its published
/// export surface (only `CrepeFeature` and the `core` module are
/// re-exported from `@milkdown/crepe`'s index). Extracting the shape from
/// the constructor's own parameter type, the same technique
/// `toolbar-mode.ts` already uses for `features`, gets correct contextual
/// typing for `buildToolbar`/`buildTopBar` without needing those names.

const DIFF_ICON = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v14M8 17l-4-4M8 17l4-4M16 21V7M16 7l4 4M16 7l-4 4"/></svg>';
function isDiffActive(ctx) {
  const view = ctx.get(editorViewCtx);
  return diffPluginKey.getState(view.state)?.active ?? false;
}
function onToggle(ctx) {
  ctx.get(diffToggleCtx.key).onToggle();
}

/// Adds a "Diff" toggle button to whichever chrome (floating Toolbar or
/// fixed TopBar) is active. The button itself only flips the Ember-side
/// `@showDiff` arg via the ctx-stored callback, it never dispatches
/// `startDiffReviewCmd`/`clearDiffReviewCmd` directly, `@showDiff` stays
/// the single source of truth (CrepeSyncManager applies it, see
/// crepe-sync-manager.ts), so the button and a consumer's own "Show diff"
/// control never disagree about the current state.
function diffFeatureConfigs() {
  return {
    [CrepeFeature.Toolbar]: {
      buildToolbar: builder => {
        builder.addGroup('diff', 'Diff').addItem('toggle-diff', {
          icon: DIFF_ICON,
          label: 'Show diff',
          active: isDiffActive,
          onRun: onToggle
        });
      }
    },
    [CrepeFeature.TopBar]: {
      buildTopBar: builder => {
        builder.addGroup('diff', 'Diff').addItem('toggle-diff', {
          icon: DIFF_ICON,
          active: isDiffActive,
          onRun: onToggle
        });
      }
    }
  };
}

export { diffFeatureConfigs };
//# sourceMappingURL=toolbar-button.js.map
