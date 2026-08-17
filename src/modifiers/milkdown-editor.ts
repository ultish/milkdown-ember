import { registerDestructor } from '@ember/destroyable';
import { waitForPromise } from '@ember/test-waiters';
import Modifier from 'ember-modifier';

import { CrepeSyncManager } from '../-private/crepe-sync-manager.ts';
import {
  registerEditor,
  unregisterEditor,
} from '../-private/editor-registry.ts';

import type { DiffMode } from '../-private/diff/types.ts';
import type { MentionSearch } from '../-private/mention/types.ts';
import type { ToolbarMode } from '../-private/toolbar-mode.ts';
import type { NamedArgs } from 'ember-modifier';

export interface MilkdownEditorModifierSignature {
  Element: HTMLElement;
  Args: {
    Named: {
      value?: string;
      onChange?: (markdown: string) => void;
      toolbar?: ToolbarMode;
      blockHandle?: boolean;
      onMentionSearch?: MentionSearch;
      mentionTrigger?: string;
      compareValue?: string;
      diffMode?: DiffMode;
      showDiff?: boolean;
      onShowDiffChange?: (show: boolean) => void;
    };
  };
}

export default class MilkdownEditorModifier extends Modifier<MilkdownEditorModifierSignature> {
  #manager: CrepeSyncManager | undefined;

  modify(
    element: HTMLElement,
    _positional: [],
    named: NamedArgs<MilkdownEditorModifierSignature>,
  ): void {
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
      onShowDiffChange,
    } = named;
    const mention = onMentionSearch
      ? { onSearch: onMentionSearch, trigger: mentionTrigger }
      : undefined;

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
        onShowDiffChange,
      });
      registerEditor(element, this.#manager);
      registerDestructor(this, () => {
        unregisterEditor(element);
        // Ember's destroyable system doesn't await destructors, so without
        // this a second editor can start registering the same module-level
        // Milkdown plugin singletons (mentionConfigCtx, mentionSlash) while
        // this instance's teardown is still in flight, a real race that
        // surfaced as an intermittent "slice is undefined" ctx error.
        void waitForPromise(
          this.#manager!.destroy(),
          'milkdown-ember:crepe-destroy',
        );
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
      onShowDiffChange,
    });
  }
}
