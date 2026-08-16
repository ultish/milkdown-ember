import { tracked } from '@glimmer/tracking';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MilkdownEditor from '#src/components/milkdown-editor.gts';

function getEditorRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>(
    '[data-milkdown-ember-editor]',
  );
  if (!root) throw new Error('editor root did not render');
  return root;
}

function getSideBySide(): HTMLElement {
  const el = document.querySelector<HTMLElement>(
    '[data-milkdown-ember-diff-side-by-side]',
  );
  if (!el) throw new Error('side-by-side view did not render');
  return el;
}

module(
  'Integration | Component | milkdown-editor | diff side-by-side',
  function (hooks) {
    setupRenderingTest(hooks);

    test('@diffMode="sideBySide" renders two panes and hides (not removes) the live editor', async function (assert) {
      await render(
        <template>
          <MilkdownEditor
            @value="hello world"
            @compareValue="hello there"
            @showDiff={{true}}
            @diffMode="sideBySide"
          />
        </template>,
      );

      assert.dom(getEditorRoot()).hasAttribute('hidden');
      assert.dom(getEditorRoot()).exists('editor stays mounted, only hidden');

      const view = getSideBySide();
      assert
        .dom('[data-diff-pane="old"] [data-diff-block]', view)
        .exists({ count: 1 });
      assert
        .dom('[data-diff-pane="new"] [data-diff-block]', view)
        .exists({ count: 1 });
      assert
        .dom('[data-diff-pane="old"] [data-diff-block]', view)
        .hasAttribute('data-diff-status', 'changed');
      assert
        .dom('[data-diff-pane="new"] [data-diff-block]', view)
        .hasAttribute('data-diff-status', 'changed');
      assert
        .dom('[data-diff-pane="old"] [data-diff-block]', view)
        .hasText('hello world');
      assert
        .dom('[data-diff-pane="new"] [data-diff-block]', view)
        .hasText('hello there');
    });

    test('an unchanged block is not marked changed', async function (assert) {
      const value = 'first paragraph\n\nsecond paragraph';
      const compareValue = 'first paragraph\n\nsecond paragraph, edited';

      await render(
        <template>
          <MilkdownEditor
            @value={{value}}
            @compareValue={{compareValue}}
            @showDiff={{true}}
            @diffMode="sideBySide"
          />
        </template>,
      );

      const view = getSideBySide();
      const oldBlocks = view.querySelectorAll(
        '[data-diff-pane="old"] [data-diff-block]',
      );
      assert.strictEqual(oldBlocks.length, 2, 'both paragraphs rendered');
      assert.strictEqual(
        oldBlocks[0]?.getAttribute('data-diff-status'),
        'unchanged',
        'first paragraph is identical in both versions',
      );
      assert.strictEqual(
        oldBlocks[1]?.getAttribute('data-diff-status'),
        'changed',
        'second paragraph differs',
      );
    });

    test('toggling @showDiff off removes the side-by-side view and unhides the editor', async function (assert) {
      class State {
        @tracked showDiff = true;
      }
      const state = new State();

      await render(
        <template>
          <MilkdownEditor
            @value="hello world"
            @compareValue="hello there"
            @showDiff={{state.showDiff}}
            @diffMode="sideBySide"
          />
        </template>,
      );

      assert.dom('[data-milkdown-ember-diff-side-by-side]').exists();

      state.showDiff = false;
      await settled();

      assert.dom('[data-milkdown-ember-diff-side-by-side]').doesNotExist();
      assert.dom(getEditorRoot()).doesNotHaveAttribute('hidden');
    });
  },
);
