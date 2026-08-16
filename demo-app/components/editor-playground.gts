import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';

import MilkdownEditor from '#src/components/milkdown-editor.gts';

import type { MentionCandidate, DiffMode, ToolbarMode } from '#src/index.ts';

const USERS: MentionCandidate[] = [
  { id: 'u1', label: 'Ada Lovelace' },
  { id: 'u2', label: 'Alan Turing' },
  { id: 'u3', label: 'Grace Hopper' },
  { id: 'u4', label: 'Katherine Johnson' },
];

const INITIAL_VALUE = `# Release notes

Type @ to mention someone.

- [ ] Update the changelog
- [ ] Cut the release`;

const COMPARE_VALUE = `# Release notes v2

Type @ to mention someone, a search popup opens.

- [x] Update the changelog
- [ ] Cut the release
- [ ] Announce in #general`;

export interface EditorPlaygroundSignature {
  Element: HTMLDivElement;
}

/// One live editor exercising all four subsystems (sync, toolbar swap,
/// mention, diff), reused across the plain-CSS / Tailwind / DaisyUI demo
/// sections. Only the wrapping CSS class differs between sections, the
/// component and its usage of <MilkdownEditor> are identical, which is
/// the point: the same markup styles under any of the three systems.
export default class EditorPlayground extends Component<EditorPlaygroundSignature> {
  @tracked value = INITIAL_VALUE;
  @tracked toolbar: ToolbarMode = 'floating';
  @tracked blockHandle = true;
  @tracked showDiff = false;
  @tracked diffMode: DiffMode = 'inline';

  onSearch = (query: string): MentionCandidate[] => {
    const q = query.toLowerCase();
    return USERS.filter((u) => u.label.toLowerCase().includes(q));
  };

  onChange = (markdown: string): void => {
    this.value = markdown;
  };

  onShowDiffChange = (show: boolean): void => {
    this.showDiff = show;
  };

  toggleToolbar = (): void => {
    this.toolbar = this.toolbar === 'floating' ? 'static' : 'floating';
  };

  toggleBlockHandle = (): void => {
    this.blockHandle = !this.blockHandle;
  };

  setDiffMode = (mode: DiffMode): void => {
    this.diffMode = mode;
    this.showDiff = true;
  };

  hideDiff = (): void => {
    this.showDiff = false;
  };

  <template>
    <div ...attributes>
      <div class="demo-controls">
        <button type="button" {{on "click" this.toggleToolbar}}>
          Toolbar:
          {{this.toolbar}}
        </button>
        <button type="button" {{on "click" this.toggleBlockHandle}}>
          Block handle:
          {{if this.blockHandle "on" "off"}}
        </button>
        <button type="button" {{on "click" (fn this.setDiffMode "inline")}}>
          Show diff (inline)
        </button>
        <button type="button" {{on "click" (fn this.setDiffMode "sideBySide")}}>
          Show diff (side by side)
        </button>
        <button type="button" {{on "click" this.hideDiff}}>Hide diff</button>
      </div>

      <MilkdownEditor
        @value={{this.value}}
        @onChange={{this.onChange}}
        @toolbar={{this.toolbar}}
        @blockHandle={{this.blockHandle}}
        @onMentionSearch={{this.onSearch}}
        @compareValue={{COMPARE_VALUE}}
        @showDiff={{this.showDiff}}
        @diffMode={{this.diffMode}}
        @onShowDiffChange={{this.onShowDiffChange}}
      />

      <pre class="demo-output">{{this.value}}</pre>
    </div>
  </template>
}
