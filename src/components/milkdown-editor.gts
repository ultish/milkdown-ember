import milkdownEditorModifier from '../modifiers/milkdown-editor.ts';

import type { TOC } from '@ember/component/template-only';
import type { ToolbarMode } from '../-private/toolbar-mode.ts';

export interface MilkdownEditorSignature {
  Element: HTMLDivElement;
  Args: {
    value?: string;
    onChange?: (markdown: string) => void;
    toolbar?: ToolbarMode;
  };
}

const MilkdownEditor: TOC<MilkdownEditorSignature> = <template>
  <div
    data-milkdown-ember-editor
    data-toolbar={{if @toolbar @toolbar "floating"}}
    {{milkdownEditorModifier value=@value onChange=@onChange toolbar=@toolbar}}
    ...attributes
  ></div>
</template>;

export default MilkdownEditor;
