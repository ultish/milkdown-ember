import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import diffSideBySideModifier from './side-by-side-modifier.ts';

import type { SideBySideBlocks } from './side-by-side-blocks.ts';

export interface DiffSideBySideSignature {
  Element: HTMLDivElement;
  Args: {
    value: string;
    compareValue: string;
  };
}

/// Headless: no CSS shipped, consumer styles `[data-diff-pane]` /
/// `[data-diff-block]` / `[data-diff-status]`. Block-level highlighting
/// only, see side-by-side-blocks.ts for why (the two panes are
/// independent, unaligned renders with no shared position space).
export default class DiffSideBySide extends Component<DiffSideBySideSignature> {
  @tracked blocks: SideBySideBlocks = { oldBlocks: [], newBlocks: [] };

  setBlocks = (blocks: SideBySideBlocks): void => {
    this.blocks = blocks;
  };

  <template>
    <div
      data-milkdown-ember-diff-side-by-side
      {{diffSideBySideModifier
        value=@value
        compareValue=@compareValue
        onBlocks=this.setBlocks
      }}
      ...attributes
    >
      <div data-diff-pane="old">
        {{#each this.blocks.oldBlocks as |block|}}
          <div
            data-diff-block
            data-diff-status={{if block.changed "changed" "unchanged"}}
          >{{block.text}}</div>
        {{/each}}
      </div>
      <div data-diff-pane="new">
        {{#each this.blocks.newBlocks as |block|}}
          <div
            data-diff-block
            data-diff-status={{if block.changed "changed" "unchanged"}}
          >{{block.text}}</div>
        {{/each}}
      </div>
    </div>
  </template>
}
