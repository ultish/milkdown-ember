import Component from '@glimmer/component';
import DiffSideBySide from '../-private/diff/side-by-side.js';
import MilkdownEditorModifier from '../modifiers/milkdown-editor.js';
import { precompileTemplate } from '@ember/template-compilation';
import { setComponentTemplate } from '@ember/component';

class MilkdownEditor extends Component {
  /// Side-by-side swaps out the rendered view instead of toggling a
  /// Milkdown-level command (unlike inline mode): it's a plain Ember
  /// conditional, so the live editor's DOM stays mounted (`hidden`, not
  /// removed by `{{#if}}`) rather than tearing down and rebuilding the
  /// Crepe instance for what's meant to be a temporary review toggle.
  get isShowingSideBySideDiff() {
    return (this.args.showDiff ?? false) && this.args.diffMode === 'sideBySide' && this.args.compareValue !== undefined;
  }
  static {
    setComponentTemplate(precompileTemplate("<div data-milkdown-ember-editor-wrapper ...attributes>\n  <div data-milkdown-ember-editor data-toolbar={{if @toolbar @toolbar \"floating\"}} hidden={{this.isShowingSideBySideDiff}} {{milkdownEditorModifier value=@value onChange=@onChange toolbar=@toolbar blockHandle=@blockHandle onMentionSearch=@onMentionSearch mentionTrigger=@mentionTrigger compareValue=@compareValue diffMode=@diffMode showDiff=@showDiff onShowDiffChange=@onShowDiffChange}}></div>\n  {{#if this.isShowingSideBySideDiff}}\n    <DiffSideBySide @value={{if @value @value \"\"}} @compareValue={{if @compareValue @compareValue \"\"}} />\n  {{/if}}\n</div>", {
      strictMode: true,
      scope: () => ({
        milkdownEditorModifier: MilkdownEditorModifier,
        DiffSideBySide
      })
    }), this);
  }
}

export { MilkdownEditor as default };
//# sourceMappingURL=milkdown-editor.js.map
