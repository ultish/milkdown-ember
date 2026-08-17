import Component from '@glimmer/component';
import type { DiffMode } from '../-private/diff/types.ts';
import type { MentionSearch } from '../-private/mention/types.ts';
import type { ToolbarMode } from '../-private/toolbar-mode.ts';
export interface MilkdownEditorSignature {
    Element: HTMLDivElement;
    Args: {
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
}
export default class MilkdownEditor extends Component<MilkdownEditorSignature> {
    get isShowingSideBySideDiff(): boolean;
}
//# sourceMappingURL=milkdown-editor.d.ts.map