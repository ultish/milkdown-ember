import Component from '@glimmer/component';
import type { SideBySideBlocks } from './side-by-side-blocks.ts';
export interface DiffSideBySideSignature {
    Element: HTMLDivElement;
    Args: {
        value: string;
        compareValue: string;
    };
}
export default class DiffSideBySide extends Component<DiffSideBySideSignature> {
    blocks: SideBySideBlocks;
    setBlocks: (blocks: SideBySideBlocks) => void;
}
//# sourceMappingURL=side-by-side.d.ts.map