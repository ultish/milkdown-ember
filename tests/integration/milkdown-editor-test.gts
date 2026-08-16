import { tracked } from '@glimmer/tracking';
import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MilkdownEditor from '#src/components/milkdown-editor.gts';
import { typeIntoMilkdownEditor } from '#src/test-support.ts';

// Crepe's listener plugin debounces markdownUpdated 200ms (trailing edge),
// so tests that type and then assert on onChange need to wait past that.
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

function getEditable(): HTMLElement {
  const editable = getEditorRoot().querySelector<HTMLElement>(
    '[contenteditable="true"]',
  );
  if (!editable)
    throw new Error('editor did not mount a contenteditable surface');
  return editable;
}

module('Integration | Component | milkdown-editor', function (hooks) {
  setupRenderingTest(hooks);

  test('typing fires onChange with the resulting markdown', async function (assert) {
    const received: string[] = [];
    const onChange = (markdown: string) => received.push(markdown);

    await render(
      <template><MilkdownEditor @value="" @onChange={{onChange}} /></template>,
    );

    typeIntoMilkdownEditor(getEditorRoot(), 'hello world');
    await waitForMarkdownDebounce();
    await settled();

    assert.true(
      received.some((markdown) => markdown.includes('hello world')),
      `onChange fired with typed content, got: ${JSON.stringify(received)}`,
    );
  });

  test('external @value changes update content, and onChange echoing back into @value does not trigger a redundant replace', async function (assert) {
    class State {
      @tracked value = 'one';
    }
    const state = new State();
    const onChange = (markdown: string) => {
      state.value = markdown;
    };

    await render(
      <template>
        <MilkdownEditor @value={{state.value}} @onChange={{onChange}} />
      </template>,
    );

    const editable = getEditable();
    assert.true(
      editable.textContent?.includes('one'),
      'seeded with initial @value',
    );

    let mutated = false;
    const observer = new MutationObserver(() => {
      mutated = true;
    });
    observer.observe(editable, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    // Genuine external push: something outside the editor sets @value directly.
    state.value = 'two';
    await settled();

    assert.true(mutated, 'external @value change replaced editor content');
    assert.true(
      editable.textContent?.includes('two'),
      'editor now shows the externally-pushed value',
    );

    // Typing causes its own real DOM mutation; that's expected and not what
    // we're testing here, so isolate the window that actually matters below.
    mutated = false;
    typeIntoMilkdownEditor(getEditorRoot(), ' three');
    await waitForMarkdownDebounce();
    await settled(); // onChange fires, round-trips the exact same markdown into @value

    mutated = false;
    await waitForMarkdownDebounce();
    await settled();

    assert.false(
      mutated,
      'onChange echoing its own markdown back into @value caused no additional replace',
    );

    observer.disconnect();
  });
});
