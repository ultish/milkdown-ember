import Modifier from 'ember-modifier';
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
    #private;
    modify(element: HTMLElement, _positional: [], named: NamedArgs<MilkdownEditorModifierSignature>): void;
}
//# sourceMappingURL=milkdown-editor.d.ts.map