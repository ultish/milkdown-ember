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

module('Integration | Component | milkdown-editor | toolbar', function (hooks) {
  setupRenderingTest(hooks);

  test('@toolbar="floating" mounts the floating toolbar, not the top bar', async function (assert) {
    await render(
      <template><MilkdownEditor @value="hi" @toolbar="floating" /></template>,
    );

    const root = getEditorRoot();
    assert.dom('.milkdown-toolbar', root).exists();
    assert.dom('.milkdown-top-bar', root).doesNotExist();
  });

  test('@toolbar="static" mounts the top bar, not the floating toolbar', async function (assert) {
    await render(
      <template><MilkdownEditor @value="hi" @toolbar="static" /></template>,
    );

    const root = getEditorRoot();
    assert.dom('.milkdown-top-bar', root).exists();
    assert.dom('.milkdown-toolbar', root).doesNotExist();
  });

  test('defaults to the floating toolbar when @toolbar is omitted', async function (assert) {
    await render(<template><MilkdownEditor @value="hi" /></template>);

    const root = getEditorRoot();
    assert.dom(root).hasAttribute('data-toolbar', 'floating');
    assert.dom('.milkdown-toolbar', root).exists();
    assert.dom('.milkdown-top-bar', root).doesNotExist();
  });

  test('switching @toolbar at runtime swaps the chrome and preserves content', async function (assert) {
    class State {
      @tracked toolbar: 'floating' | 'static' = 'floating';
    }
    const state = new State();

    await render(
      <template>
        <MilkdownEditor @value="preserve me" @toolbar={{state.toolbar}} />
      </template>,
    );

    let root = getEditorRoot();
    assert.dom('.milkdown-toolbar', root).exists('starts floating');
    assert.true(root.textContent?.includes('preserve me'));

    state.toolbar = 'static';
    await settled();

    root = getEditorRoot();
    assert.dom('.milkdown-top-bar', root).exists('swapped to static');
    assert.dom('.milkdown-toolbar', root).doesNotExist();
    assert.true(
      root.textContent?.includes('preserve me'),
      'content survives the destroy/recreate that a toolbar swap requires',
    );
  });
});
