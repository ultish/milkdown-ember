import Component from '@glimmer/component';

import DiffSideBySide from '../-private/diff/side-by-side.gts';
import milkdownEditorModifier from '../modifiers/milkdown-editor.ts';

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

export default class MilkdownEditor extends Component<MilkdownEditorSignature> {
  /// Side-by-side swaps out the rendered view instead of toggling a
  /// Milkdown-level command (unlike inline mode): it's a plain Ember
  /// conditional, so the live editor's DOM stays mounted (`hidden`, not
  /// removed by `{{#if}}`) rather than tearing down and rebuilding the
  /// Crepe instance for what's meant to be a temporary review toggle.
  get isShowingSideBySideDiff(): boolean {
    return (
      (this.args.showDiff ?? false) &&
      this.args.diffMode === 'sideBySide' &&
      this.args.compareValue !== undefined
    );
  }

  <template>
    <div data-milkdown-ember-editor-wrapper ...attributes>
      <div
        data-milkdown-ember-editor
        data-toolbar={{if @toolbar @toolbar "floating"}}
        hidden={{this.isShowingSideBySideDiff}}
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
      ></div>
      {{#if this.isShowingSideBySideDiff}}
        <DiffSideBySide
          @value={{if @value @value ""}}
          @compareValue={{if @compareValue @compareValue ""}}
        />
      {{/if}}
    </div>
  </template>
}
