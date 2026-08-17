import type { Node as ProseNode } from '@milkdown/kit/prose/model';
export declare class DiffParser {
    #private;
    constructor();
    parse(markdown: string): Promise<ProseNode | undefined>;
    destroy(): Promise<void>;
}
//# sourceMappingURL=parser.d.ts.map