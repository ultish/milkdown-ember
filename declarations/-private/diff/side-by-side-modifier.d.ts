import Modifier from 'ember-modifier';
import type { SideBySideBlocks } from './side-by-side-blocks.ts';
import type { NamedArgs } from 'ember-modifier';
export interface DiffSideBySideModifierSignature {
    Element: Element;
    Args: {
        Named: {
            value: string;
            compareValue: string;
            onBlocks: (blocks: SideBySideBlocks) => void;
        };
    };
}
export default class DiffSideBySideModifier extends Modifier<DiffSideBySideModifierSignature> {
    #private;
    modify(_element: Element, _positional: [], named: NamedArgs<DiffSideBySideModifierSignature>): void;
}
//# sourceMappingURL=side-by-side-modifier.d.ts.map