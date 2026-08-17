import { registerDestructor } from '@ember/destroyable';
import { waitForPromise } from '@ember/test-waiters';
import Modifier from 'ember-modifier';

import { DiffParser } from './parser.ts';
import { computeSideBySideBlocks } from './side-by-side-blocks.ts';

import type { SideBySideBlocks } from './side-by-side-blocks.ts';
import type { NamedArgs } from 'ember-modifier';

export interface DiffSideBySideModifierSignature {
  Element: Element;
  Args: {
    Named: {
      value: string;
      compareValue: string;
      onBlocks: (blocks: SideBySideBlocks) => void;
    };
  };
}

/// Owns a DiffParser and recomputes side-by-side blocks whenever `value`
/// or `compareValue` change, reporting results back through `onBlocks`
/// rather than rendering directly, the same "modifier owns the imperative
/// resource, exposes a minimal reactive surface via callback" shape as
/// milkdown-editor.ts and CrepeSyncManager.
export default class DiffSideBySideModifier extends Modifier<DiffSideBySideModifierSignature> {
  #parser: DiffParser | undefined;
  #generation = 0;

  modify(
    _element: Element,
    _positional: [],
    named: NamedArgs<DiffSideBySideModifierSignature>,
  ): void {
    if (!this.#parser) {
      this.#parser = new DiffParser();
      const parser = this.#parser;
      registerDestructor(this, () => {
        void waitForPromise(
          parser.destroy(),
          'milkdown-ember:diff-parser-destroy',
        );
      });
    }
    // Wrap the whole chain, not just DiffParser's own internal creation
    // promise: without this, `settled()` in tests can return before
    // `onBlocks` has actually been called, since Ember's test waiters
    // only track promises explicitly registered with them.
    void waitForPromise(
      this.#recompute(named.value, named.compareValue, named.onBlocks),
      'milkdown-ember:diff-side-by-side-recompute',
    );
  }

  async #recompute(
    value: string,
    compareValue: string,
    onBlocks: (blocks: SideBySideBlocks) => void,
  ): Promise<void> {
    const generation = ++this.#generation;
    const parser = this.#parser!;

    const [oldDoc, newDoc] = await Promise.all([
      parser.parse(value),
      parser.parse(compareValue),
    ]);
    if (generation !== this.#generation) return; // superseded by a newer arg change
    if (!oldDoc || !newDoc) return;

    onBlocks(computeSideBySideBlocks(oldDoc, newDoc));
  }
}
