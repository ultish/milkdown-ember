import type { Node as ProseNode } from '@milkdown/kit/prose/model';
export interface DiffBlock {
    text: string;
    changed: boolean;
}
export interface SideBySideBlocks {
    oldBlocks: DiffBlock[];
    newBlocks: DiffBlock[];
}
export declare function computeSideBySideBlocks(oldDoc: ProseNode, newDoc: ProseNode): SideBySideBlocks;
//# sourceMappingURL=side-by-side-blocks.d.ts.map