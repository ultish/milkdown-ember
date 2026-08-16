import milkdownEditorModifier from '../modifiers/milkdown-editor.ts';

import type { TOC } from '@ember/component/template-only';
import type { DiffMode } from '../-private/diff/types.ts';
import type { MentionSearch } from '../-private/mention/types.ts';
import type { ToolbarMode } from '../-private/toolbar-mode.ts';

export interface MilkdownEditorSignature {
  Element: HTMLDivElement;
  Args: {
    value?: string;
    onChange?: (markdown: string) => void;
    toolbar?: ToolbarMode;
    onMentionSearch?: MentionSearch;
    mentionTrigger?: string;
    compareValue?: string;
    diffMode?: DiffMode;
    showDiff?: boolean;
    onShowDiffChange?: (show: boolean) => void;
  };
}

const MilkdownEditor: TOC<MilkdownEditorSignature> = <template>
  <div
    data-milkdown-ember-editor
    data-toolbar={{if @toolbar @toolbar "floating"}}
    {{milkdownEditorModifier
      value=@value
      onChange=@onChange
      toolbar=@toolbar
      onMentionSearch=@onMentionSearch
      mentionTrigger=@mentionTrigger
      compareValue=@compareValue
      diffMode=@diffMode
      showDiff=@showDiff
      onShowDiffChange=@onShowDiffChange
    }}
    ...attributes
  ></div>
</template>;

export default MilkdownEditor;
