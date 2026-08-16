import { registerDestructor } from '@ember/destroyable';
import Modifier from 'ember-modifier';

import { CrepeSyncManager } from '../-private/crepe-sync-manager.ts';
import {
  registerEditor,
  unregisterEditor,
} from '../-private/editor-registry.ts';

import type { ToolbarMode } from '../-private/toolbar-mode.ts';
import type { NamedArgs } from 'ember-modifier';

export interface MilkdownEditorModifierSignature {
  Element: HTMLElement;
  Args: {
    Named: {
      value?: string;
      onChange?: (markdown: string) => void;
      toolbar?: ToolbarMode;
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
    const { value = '', onChange, toolbar = 'floating' } = named;

    if (!this.#manager) {
      this.#manager = new CrepeSyncManager(element, {
        value,
        toolbar,
        onChange,
      });
      registerEditor(element, this.#manager);
      registerDestructor(this, () => {
        unregisterEditor(element);
        void this.#manager?.destroy();
      });
      return;
    }

    this.#manager.update({ value, toolbar, onChange });
  }
}
