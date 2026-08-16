import { tracked } from '@glimmer/tracking';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MilkdownEditor from '#src/components/milkdown-editor.gts';

// Crepe's listener plugin debounces markdownUpdated 200ms (trailing edge),
// so tests that trigger a doc change and then assert on onChange need to
// wait past that.
function waitForMarkdownDebounce(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 260));
}

function getEditorRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>(
    '[data-milkdown-ember-editor]',
  );
  if (!root) throw new Error('editor root did not render');
  return root;
}

module('Integration | Component | milkdown-editor | diff', function (hooks) {
  setupRenderingTest(hooks);

  test('@showDiff renders insert/delete decorations comparing @value against @compareValue', async function (assert) {
    await render(
      <template>
        <MilkdownEditor
          @value="hello world"
          @compareValue="hello there"
          @showDiff={{true}}
        />
      </template>,
    );

    const root = getEditorRoot();
    assert.dom('.milkdown-diff-added', root).exists('shows the new text');
    assert.dom('.milkdown-diff-removed', root).exists('shows the old text');
  });

  test('toggling @showDiff off clears the review', async function (assert) {
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
        />
      </template>,
    );

    assert
      .dom('.milkdown-diff-added', getEditorRoot())
      .exists('review starts active');

    state.showDiff = false;
    await settled();
    assert
      .dom('.milkdown-diff-added', getEditorRoot())
      .doesNotExist('review cleared once @showDiff flips false');
  });

  test('the toolbar diff button flips @showDiff through onShowDiffChange', async function (assert) {
    class State {
      @tracked showDiff = false;
    }
    const state = new State();
    const onShowDiffChange = (show: boolean) => {
      state.showDiff = show;
    };

    await render(
      <template>
        <MilkdownEditor
          @value="hello world"
          @compareValue="hello there"
          @showDiff={{state.showDiff}}
          @onShowDiffChange={{onShowDiffChange}}
        />
      </template>,
    );

    const root = getEditorRoot();
    assert.dom('.milkdown-diff-added', root).doesNotExist('starts closed');

    const button = root.querySelector<HTMLElement>('[aria-label="Show diff"]');
    assert.ok(button, 'diff toggle button rendered on the toolbar');
    // Crepe's toolbar buttons listen on pointerdown, not click (see
    // feature/toolbar/component.tsx's onPointerdown={onClick(item.onRun)}).
    button!.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settled();

    assert.true(state.showDiff, 'onShowDiffChange flipped the tracked state');
    assert
      .dom('.milkdown-diff-added', root)
      .exists('review opened as a result');
  });

  test('accepting the change resolves the review and updates the editor content', async function (assert) {
    const received: string[] = [];
    const onChange = (markdown: string) => received.push(markdown);

    await render(
      <template>
        <MilkdownEditor
          @value="hello world"
          @compareValue="hello there"
          @showDiff={{true}}
          @onChange={{onChange}}
        />
      </template>,
    );

    const acceptButton = getEditorRoot().querySelector<HTMLElement>(
      '.milkdown-diff-accept',
    );
    assert.ok(acceptButton, 'accept control rendered');
    acceptButton!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await waitForMarkdownDebounce();
    await settled();

    assert
      .dom('.milkdown-diff-added', getEditorRoot())
      .doesNotExist('review auto-closes once its only change is resolved');
    assert.true(
      received.at(-1)?.includes('hello there'),
      `editor content now matches compareValue, got: ${JSON.stringify(received.at(-1))}`,
    );
  });
});
