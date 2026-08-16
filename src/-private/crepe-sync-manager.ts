import { waitForPromise } from '@ember/test-waiters';
import { Crepe } from '@milkdown/crepe';
import { editorViewCtx } from '@milkdown/kit/core';
import { replaceAll } from '@milkdown/kit/utils';

import { featuresForToolbarMode } from './toolbar-mode.ts';

import type { ToolbarMode } from './toolbar-mode.ts';

export interface CrepeSyncManagerArgs {
  value: string;
  toolbar: ToolbarMode;
  onChange?: (markdown: string) => void;
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
  #root: Element;
  #ready: Promise<void>;

  constructor(root: Element, args: CrepeSyncManagerArgs) {
    this.#root = root;
    this.#lastKnownMarkdown = args.value;
    this.#toolbar = args.toolbar;
    this.#onChange = args.onChange;
    this.#ready = this.#create(args.value);
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

    if (args.toolbar !== this.#toolbar) {
      this.#toolbar = args.toolbar;
      this.#ready = this.#recreateForToolbarChange();
      return;
    }

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

  async #create(value: string): Promise<void> {
    const crepe = new Crepe({
      root: this.#root,
      defaultValue: value,
      features: featuresForToolbarMode(this.#toolbar),
    });

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

  async #recreateForToolbarChange(): Promise<void> {
    await this.#ready.catch(() => undefined);

    // Live truth over the incoming arg: a toolbar-only change may arrive
    // with a `value` that's stale relative to what the user just typed.
    const value = this.getMarkdown();
    await this.#crepe?.destroy();
    this.#crepe = undefined;
    this.#lastKnownMarkdown = value;

    await this.#create(value);
  }
}
