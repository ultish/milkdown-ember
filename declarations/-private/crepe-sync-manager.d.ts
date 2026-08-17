import type { DiffMode } from './diff/types.ts';
import type { MentionConfig } from './mention/types.ts';
import type { ToolbarMode } from './toolbar-mode.ts';
export interface CrepeSyncManagerArgs {
    value: string;
    toolbar: ToolbarMode;
    blockHandle: boolean;
    onChange?: (markdown: string) => void;
    mention?: MentionConfig;
    compareValue?: string;
    diffMode: DiffMode;
    showDiff: boolean;
    onShowDiffChange?: (show: boolean) => void;
}
export declare class CrepeSyncManager {
    #private;
    constructor(root: Element, args: CrepeSyncManagerArgs);
    get ready(): Promise<void>;
    getMarkdown(): string;
    update(args: CrepeSyncManagerArgs): void;
    destroy(): Promise<void>;
    insertTextForTest(text: string): void;
}
//# sourceMappingURL=crepe-sync-manager.d.ts.map