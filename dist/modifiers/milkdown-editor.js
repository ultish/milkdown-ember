import { registerDestructor } from '@ember/destroyable';
import { waitForPromise } from '@ember/test-waiters';
import Modifier from 'ember-modifier';
import { CrepeSyncManager } from '../-private/crepe-sync-manager.js';
import { registerEditor, unregisterEditor } from '../-private/editor-registry.js';

class MilkdownEditorModifier extends Modifier {
  #manager;
  modify(element, _positional, named) {
    const {
      value = '',
      onChange,
      toolbar = 'floating',
      blockHandle = true,
      onMentionSearch,
      mentionTrigger,
      compareValue,
      diffMode = 'inline',
      showDiff = false,
      onShowDiffChange
    } = named;
    const mention = onMentionSearch ? {
      onSearch: onMentionSearch,
      trigger: mentionTrigger
    } : undefined;
    if (!this.#manager) {
      this.#manager = new CrepeSyncManager(element, {
        value,
        toolbar,
        blockHandle,
        onChange,
        mention,
        compareValue,
        diffMode,
        showDiff,
        onShowDiffChange
      });
      registerEditor(element, this.#manager);
      registerDestructor(this, () => {
        unregisterEditor(element);
        // Ember's destroyable system doesn't await destructors, so without
        // this a second editor can start registering the same module-level
        // Milkdown plugin singletons (mentionConfigCtx, mentionSlash) while
        // this instance's teardown is still in flight, a real race that
        // surfaced as an intermittent "slice is undefined" ctx error.
        void waitForPromise(this.#manager.destroy(), 'milkdown-ember:crepe-destroy');
      });
      return;
    }
    this.#manager.update({
      value,
      toolbar,
      blockHandle,
      onChange,
      mention,
      compareValue,
      diffMode,
      showDiff,
      onShowDiffChange
    });
  }
}

export { MilkdownEditorModifier as default };
//# sourceMappingURL=milkdown-editor.js.map
