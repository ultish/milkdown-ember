import { registerDestructor } from '@ember/destroyable';
import { waitForPromise } from '@ember/test-waiters';
import Modifier from 'ember-modifier';
import { DiffParser } from './parser.js';
import { computeSideBySideBlocks } from './side-by-side-blocks.js';

/// Owns a DiffParser and recomputes side-by-side blocks whenever `value`
/// or `compareValue` change, reporting results back through `onBlocks`
/// rather than rendering directly, the same "modifier owns the imperative
/// resource, exposes a minimal reactive surface via callback" shape as
/// milkdown-editor.ts and CrepeSyncManager.
class DiffSideBySideModifier extends Modifier {
  #parser;
  #generation = 0;
  modify(_element, _positional, named) {
    if (!this.#parser) {
      this.#parser = new DiffParser();
      const parser = this.#parser;
      registerDestructor(this, () => {
        void waitForPromise(parser.destroy(), 'milkdown-ember:diff-parser-destroy');
      });
    }
    // Wrap the whole chain, not just DiffParser's own internal creation
    // promise: without this, `settled()` in tests can return before
    // `onBlocks` has actually been called, since Ember's test waiters
    // only track promises explicitly registered with them.
    void waitForPromise(this.#recompute(named.value, named.compareValue, named.onBlocks), 'milkdown-ember:diff-side-by-side-recompute');
  }
  async #recompute(value, compareValue, onBlocks) {
    const generation = ++this.#generation;
    const parser = this.#parser;
    const [oldDoc, newDoc] = await Promise.all([parser.parse(value), parser.parse(compareValue)]);
    if (generation !== this.#generation) return; // superseded by a newer arg change
    if (!oldDoc || !newDoc) return;
    onBlocks(computeSideBySideBlocks(oldDoc, newDoc));
  }
}

export { DiffSideBySideModifier as default };
//# sourceMappingURL=side-by-side-modifier.js.map
