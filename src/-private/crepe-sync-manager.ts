import { waitForPromise } from '@ember/test-waiters';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx } from '@milkdown/kit/core';
import { replaceAll } from '@milkdown/kit/utils';

import { registerMentionFeature } from './mention/feature.ts';
import { mentionConfigCtx } from './mention/popover-plugin.ts';
import { featuresForToolbarMode } from './toolbar-mode.ts';

import type { MentionConfig } from './mention/types.ts';
import type { ToolbarMode } from './toolbar-mode.ts';

export interface CrepeSyncManagerArgs {
  value: string;
  toolbar: ToolbarMode;
  onChange?: (markdown: string) => void;
  mention?: MentionConfig;
}

/// Owns a Crepe instance's lifecycle and keeps it in sync with `value` /
/// `onChange`, independent of Ember so it's testable on its own. See
/// PLAN.md, "The editor wrapper: sync contract in detail", for the reasoning
/// behind the `#lastKnownMarkdown` comparison this relies on to avoid an
/// echo loop between `onChange` and an externally-updated `value`.
export class CrepeSyncManager {
  #crepe: Crepe | undefined;
  #lastKnownMarkdown: string;
  #toolbar: ToolbarMode;
  #onChange: ((markdown: string) => void) | undefined;
  #mentionEnabled: boolean;
  #root: Element;
  #ready: Promise<void>;

  constructor(root: Element, args: CrepeSyncManagerArgs) {
    this.#root = root;
    this.#lastKnownMarkdown = args.value;
    this.#toolbar = args.toolbar;
    this.#onChange = args.onChange;
    this.#mentionEnabled = args.mention !== undefined;
    this.#ready = this.#create(args.value, args.mention);
  }

  /// Resolves once the underlying Crepe instance has finished `create()`.
  /// Crepe's own `markdownUpdated` event is debounced 200ms (its listener
  /// plugin batches transactions via lodash `debounce`), so content applied
  /// through `update()` right after construction can still be in flight
  /// when this resolves; that's expected, `onChange` isn't guaranteed to
  /// have fired yet even once `ready` settles.
  get ready(): Promise<void> {
    return this.#ready;
  }

  getMarkdown(): string {
    return this.#crepe?.getMarkdown() ?? this.#lastKnownMarkdown;
  }

  update(args: CrepeSyncManagerArgs): void {
    this.#onChange = args.onChange;

    const mentionEnabled = args.mention !== undefined;
    if (
      args.toolbar !== this.#toolbar ||
      mentionEnabled !== this.#mentionEnabled
    ) {
      this.#toolbar = args.toolbar;
      this.#mentionEnabled = mentionEnabled;
      this.#ready = this.#recreate(args.mention);
      return;
    }

    // mentionConfigCtx is read fresh on every keystroke inside the plugin
    // (see popover-plugin.ts #computeActiveQuery), so onSearch/trigger
    // update in place here with no recreate needed, unlike a presence
    // change above.
    if (args.mention) this.#applyMentionConfig(args.mention);

    if (args.value !== this.#lastKnownMarkdown) {
      this.#applyExternalValue(args.value);
    }
  }

  async destroy(): Promise<void> {
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
  insertTextForTest(text: string): void {
    const crepe = this.#crepe;
    if (!crepe) throw new Error('CrepeSyncManager: editor is not ready yet');

    crepe.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx);
      // A real user has DOM focus before typing; plugins are allowed to
      // condition on view.hasFocus() (the mention popover's trigger
      // detection does), so a synthetic transaction without this is not
      // actually representative of a real keystroke.
      view.focus();
      const { state } = view;
      const tr = state.tr.insertText(text, state.selection.to);
      view.dispatch(tr);
    });
  }

  #applyExternalValue(value: string): void {
    const crepe = this.#crepe;
    if (!crepe) return;

    // Set before dispatching: even though markdownUpdated is debounced,
    // setting this now (rather than inside the listener callback) means
    // any update() call that arrives before the debounce fires already
    // sees a matching value and skips re-applying.
    this.#lastKnownMarkdown = value;
    crepe.editor.action(replaceAll(value));
  }

  #applyMentionConfig(mention: MentionConfig): void {
    this.#crepe?.editor.action((ctx) => {
      ctx.set(mentionConfigCtx.key, mention);
    });
  }

  async #create(
    value: string,
    mention: MentionConfig | undefined,
  ): Promise<void> {
    const crepe = new Crepe({
      root: this.#root,
      defaultValue: value,
      features: featuresForToolbarMode(this.#toolbar),
    });

    if (mention) registerMentionFeature(crepe.editor, mention);

    // Must be registered before create(): Crepe's `on()` only queues onto
    // the editor config prior to creation, and switches to a live ctx
    // action afterward.
    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        this.#lastKnownMarkdown = markdown;
        this.#onChange?.(markdown);
      });
    });

    await waitForPromise(crepe.create(), 'milkdown-ember:crepe-create');
    this.#crepe = crepe;
  }

  async #recreate(mention: MentionConfig | undefined): Promise<void> {
    await this.#ready.catch(() => undefined);

    // Live truth over the incoming arg: a toolbar/mention-only change may
    // arrive with a `value` that's stale relative to what the user just typed.
    const value = this.getMarkdown();
    await this.#crepe?.destroy();
    this.#crepe = undefined;
    this.#lastKnownMarkdown = value;

    await this.#create(value, mention);
  }
}
