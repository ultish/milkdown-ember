import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import DiffSideBySideModifier from './side-by-side-modifier.js';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';
import { g, i } from 'decorator-transforms/runtime-esm';

/// Headless: no CSS shipped, consumer styles `[data-diff-pane]` /
/// `[data-diff-block]` / `[data-diff-status]`. Block-level highlighting
/// only, see side-by-side-blocks.ts for why (the two panes are
/// independent, unaligned renders with no shared position space).
class DiffSideBySide extends Component {
  static {
    g(this.prototype, "blocks", [tracked], function () {
      return {
        oldBlocks: [],
        newBlocks: []
      };
    });
  }
  #blocks = (i(this, "blocks"), void 0);
  setBlocks = blocks => {
    this.blocks = blocks;
  };
  static {
    setComponentTemplate(precompileTemplate("<div data-milkdown-ember-diff-side-by-side {{diffSideBySideModifier value=@value compareValue=@compareValue onBlocks=this.setBlocks}} ...attributes>\n  <div data-diff-pane=\"old\">\n    {{#each this.blocks.oldBlocks as |block|}}\n      <div data-diff-block data-diff-status={{if block.changed \"changed\" \"unchanged\"}}>{{block.text}}</div>\n    {{/each}}\n  </div>\n  <div data-diff-pane=\"new\">\n    {{#each this.blocks.newBlocks as |block|}}\n      <div data-diff-block data-diff-status={{if block.changed \"changed\" \"unchanged\"}}>{{block.text}}</div>\n    {{/each}}\n  </div>\n</div>", {
      strictMode: true,
      scope: () => ({
        diffSideBySideModifier: DiffSideBySideModifier
      })
    }), this);
  }
}

export { DiffSideBySide as default };
//# sourceMappingURL=side-by-side.js.map
