import { waitForPromise } from '@ember/test-waiters';
import { Crepe, CrepeFeature } from '@milkdown/crepe';
import { editorViewCtx, commandsCtx } from '@milkdown/kit/core';
import { startDiffReviewCmd, clearDiffReviewCmd } from '@milkdown/kit/plugin/diff';
import { replaceAll } from '@milkdown/kit/utils';
import { registerDiffFeature } from './diff/feature.js';
import { diffFeatureConfigs } from './diff/toolbar-button.js';
import { registerMentionFeature } from './mention/feature.js';
import { mentionConfigCtx } from './mention/popover-plugin.js';
import { featuresForToolbarMode } from './toolbar-mode.js';

function presenceOf(args) {
  return {
    toolbar: args.toolbar,
    blockHandle: args.blockHandle,
    mention: args.mention !== undefined,
    diff: args.compareValue !== undefined
  };
}
function presenceEqual(a, b) {
  return a.toolbar === b.toolbar && a.blockHandle === b.blockHandle && a.mention === b.mention && a.diff === b.diff;
}

/// Owns a Crepe instance's lifecycle and keeps it in sync with `value` /
/// `onChange`, independent of Ember so it's testable on its own. See
/// PLAN.md, "The editor wrapper: sync contract in detail", for the reasoning
/// behind the `#lastKnownMarkdown` comparison this relies on to avoid an
/// echo loop between `onChange` and an externally-updated `value`.
class CrepeSyncManager {
  #crepe;
  #lastKnownMarkdown;
  #onChange;
  #onShowDiffChange;
  #presence;
  #appliedShowDiff = false;
  #appliedCompareValue;
  #root;
  #ready;
  constructor(root, args) {
    this.#root = root;
    this.#lastKnownMarkdown = args.value;
    this.#onChange = args.onChange;
    this.#onShowDiffChange = args.onShowDiffChange;
    this.#presence = presenceOf(args);
    this.#ready = this.#create(args);
  }

  /// Resolves once the underlying Crepe instance has finished `create()`.
  /// Crepe's own `markdownUpdated` event is debounced 200ms (its listener
  /// plugin batches transactions via lodash `debounce`), so content applied
  /// through `update()` right after construction can still be in flight
  /// when this resolves; that's expected, `onChange` isn't guaranteed to
  /// have fired yet even once `ready` settles.
  get ready() {
    return this.#ready;
  }
  getMarkdown() {
    return this.#crepe?.getMarkdown() ?? this.#lastKnownMarkdown;
  }
  update(args) {
    this.#onChange = args.onChange;
    this.#onShowDiffChange = args.onShowDiffChange;
    const presence = presenceOf(args);
    if (!presenceEqual(presence, this.#presence)) {
      this.#presence = presence;
      this.#ready = this.#recreate(args);
      return;
    }

    // mentionConfigCtx is read fresh on every keystroke inside the plugin
    // (see popover-plugin.ts #computeActiveQuery), so onSearch/trigger
    // update in place here with no recreate needed, unlike a presence
    // change above.
    if (args.mention) this.#applyMentionConfig(args.mention);
    if (presence.diff && args.diffMode === 'inline') {
      this.#applyDiffState(args.showDiff, args.compareValue);
    }
    if (args.value !== this.#lastKnownMarkdown) {
      this.#applyExternalValue(args.value);
    }
  }
  async destroy() {
    await this.#ready.catch(() => undefined);
    await this.#crepe?.destroy();
  }

  /// Test-only: inserts text via a real ProseMirror transaction, the same
  /// path a user's keystroke ultimately produces once ProseMirror has
  /// translated the DOM input event into a doc change. Bypasses simulating
  /// the DOM input event itself, which is unreliable across browsers for a
  /// contenteditable surface (`execCommand('insertText', ...)` is a no-op
  /// in Firefox here) and isn't this addon's concern to re-verify, that's
  /// Milkdown's own test suite's job.
  insertTextForTest(text) {
    const crepe = this.#crepe;
    if (!crepe) throw new Error('CrepeSyncManager: editor is not ready yet');
    crepe.editor.action(ctx => {
      const view = ctx.get(editorViewCtx);
      // A real user has DOM focus before typing; plugins are allowed to
      // condition on view.hasFocus() (the mention popover's trigger
      // detection does), so a synthetic transaction without this is not
      // actually representative of a real keystroke.
      view.focus();
      const {
        state
      } = view;
      const tr = state.tr.insertText(text, state.selection.to);
      view.dispatch(tr);
    });
  }
  #applyExternalValue(value) {
    const crepe = this.#crepe;
    if (!crepe) return;

    // Set before dispatching: even though markdownUpdated is debounced,
    // setting this now (rather than inside the listener callback) means
    // any update() call that arrives before the debounce fires already
    // sees a matching value and skips re-applying.
    //
    // Note: while an inline diff review is active, Milkdown's own diff
    // plugin filters out non-diff-tagged doc-changing transactions
    // (including this replaceAll), so an external @value push is a no-op
    // for as long as @showDiff stays true. That's intentional upstream
    // behavior, not a bug in this wrapper: content shouldn't shift under
    // an active review.
    this.#lastKnownMarkdown = value;
    crepe.editor.action(replaceAll(value));
  }
  #applyMentionConfig(mention) {
    this.#crepe?.editor.action(ctx => {
      ctx.set(mentionConfigCtx.key, mention);
    });
  }
  #applyDiffState(showDiff, compareValue) {
    if (showDiff === this.#appliedShowDiff && compareValue === this.#appliedCompareValue) {
      return;
    }
    this.#appliedShowDiff = showDiff;
    this.#appliedCompareValue = compareValue;
    this.#crepe?.editor.action(ctx => {
      const commands = ctx.get(commandsCtx);
      if (showDiff && compareValue !== undefined) {
        commands.call(startDiffReviewCmd.key, compareValue);
      } else {
        commands.call(clearDiffReviewCmd.key);
      }
    });
  }
  async #create(args) {
    const crepe = new Crepe({
      root: this.#root,
      defaultValue: args.value,
      features: {
        ...featuresForToolbarMode(args.toolbar),
        [CrepeFeature.BlockEdit]: args.blockHandle
      },
      featureConfigs: {
        // `'block'` (Crepe's default) shows "Please enter..." on every
        // empty paragraph you land the cursor in, Notion-style. This addon
        // wraps a single markdown value, closer to a textarea than a
        // multi-section doc, so `'doc'` matches that: the placeholder only
        // shows while the whole document is empty, not on every blank line
        // you create while editing non-empty content.
        [CrepeFeature.Placeholder]: {
          mode: 'doc'
        },
        // Crepe's own default offset (16px) assumes its own theme's
        // generous padding (120px, from a reset.css this headless addon
        // doesn't import). At the kind of modest padding a typical
        // consumer actually uses (1rem or so), 16px isn't enough room for
        // the handle itself (~3.6rem wide) to clear the editor's edge —
        // it ends up flush against, or past, the border. Doubling it
        // gives the handle a lane in the page's own margin instead of
        // requiring the editor to carve out padding it doesn't need.
        [CrepeFeature.BlockEdit]: {
          blockHandle: {
            getOffset: () => 32
          }
        },
        ...(args.compareValue !== undefined ? diffFeatureConfigs() : {})
      }
    });
    if (args.mention) registerMentionFeature(crepe.editor, args.mention);
    if (args.compareValue !== undefined) {
      registerDiffFeature(crepe.editor, {
        onToggle: () => this.#onShowDiffChange?.(!this.#appliedShowDiff)
      });
    }

    // Must be registered before create(): Crepe's `on()` only queues onto
    // the editor config prior to creation, and switches to a live ctx
    // action afterward.
    crepe.on(listener => {
      listener.markdownUpdated((_ctx, markdown) => {
        this.#lastKnownMarkdown = markdown;
        this.#onChange?.(markdown);
      });
    });
    await waitForPromise(crepe.create(), 'milkdown-ember:crepe-create');
    this.#crepe = crepe;
    this.#appliedShowDiff = false;
    this.#appliedCompareValue = undefined;
    if (args.compareValue !== undefined && args.diffMode === 'inline' && args.showDiff) {
      this.#applyDiffState(true, args.compareValue);
    }
  }
  async #recreate(args) {
    await this.#ready.catch(() => undefined);

    // Live truth over the incoming arg: a toolbar/mention/diff-presence
    // change may arrive with a `value` that's stale relative to what the
    // user just typed.
    const value = this.getMarkdown();
    await this.#crepe?.destroy();
    this.#crepe = undefined;
    this.#lastKnownMarkdown = value;
    await this.#create({
      ...args,
      value
    });
  }
}

export { CrepeSyncManager };
//# sourceMappingURL=crepe-sync-manager.js.map
