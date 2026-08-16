import { render, settled } from '@ember/test-helpers';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';

import MilkdownEditor from '#src/components/milkdown-editor.gts';
import { typeIntoMilkdownEditor } from '#src/test-support.ts';

import type { MentionCandidate } from '#src/index.ts';

const CANDIDATES: MentionCandidate[] = [
  { id: 'u1', label: 'Ada Lovelace' },
  { id: 'u2', label: 'Alan Turing' },
];

function waitForMarkdownDebounce(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 260));
}

function waitForPopover(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 60));
}

function getEditorRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>(
    '[data-milkdown-ember-editor]',
  );
  if (!root) throw new Error('editor root did not render');
  return root;
}

function getPopover(): HTMLElement {
  const popover = getEditorRoot().parentElement?.querySelector<HTMLElement>(
    '[data-milkdown-ember-mention-popover]',
  );
  if (!popover) throw new Error('mention popover did not mount');
  return popover;
}

module('Integration | Component | milkdown-editor | mention', function (hooks) {
  setupRenderingTest(hooks);

  test('typing the trigger character searches and lists candidates', async function (assert) {
    const queries: string[] = [];
    const onSearch = (query: string) => {
      queries.push(query);
      return CANDIDATES.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      );
    };

    await render(
      <template>
        <MilkdownEditor @value="" @onMentionSearch={{onSearch}} />
      </template>,
    );

    typeIntoMilkdownEditor(getEditorRoot(), 'hi @a');
    await waitForPopover();
    await settled();

    assert.true(
      queries.includes('a'),
      `search ran with the typed query, got: ${JSON.stringify(queries)}`,
    );

    const items = getPopover().querySelectorAll('[data-mention-candidate]');
    assert.strictEqual(items.length, 2, 'both matching candidates render');
    assert.dom(getPopover()).hasAttribute('data-show', 'true');
  });

  test('selecting a candidate inserts a mention node that emits markdown encoding it as a link', async function (assert) {
    const received: string[] = [];
    const onSearch = () => CANDIDATES;
    const onChange = (markdown: string) => received.push(markdown);

    await render(
      <template>
        <MilkdownEditor
          @value=""
          @onChange={{onChange}}
          @onMentionSearch={{onSearch}}
        />
      </template>,
    );

    typeIntoMilkdownEditor(getEditorRoot(), '@a');
    await waitForPopover();
    await settled();

    const first = getPopover().querySelector<HTMLElement>(
      '[data-mention-candidate][data-index="0"]',
    );
    assert.ok(first, 'first candidate rendered');
    first!.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    await waitForMarkdownDebounce();
    await settled();

    const markdown = received.at(-1);
    assert.true(
      markdown?.includes('[@Ada Lovelace](mention:u1)'),
      `markdown encodes the mention as a link, got: ${JSON.stringify(markdown)}`,
    );
  });

  test('a mention-link markdown string parses back into a visible mention node', async function (assert) {
    await render(
      <template>
        <MilkdownEditor @value="hi [@Ada Lovelace](mention:u1)!" />
      </template>,
    );

    assert.true(getEditorRoot().textContent?.includes('@Ada Lovelace'));
  });

  test('Escape closes the popover without inserting anything', async function (assert) {
    const onSearch = () => CANDIDATES;

    await render(
      <template>
        <MilkdownEditor @value="" @onMentionSearch={{onSearch}} />
      </template>,
    );

    typeIntoMilkdownEditor(getEditorRoot(), '@a');
    await waitForPopover();
    await settled();

    assert
      .dom(getPopover())
      .hasAttribute('data-show', 'true', 'popover is showing before Escape');

    getEditorRoot()
      .querySelector('[contenteditable="true"]')!
      .dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    await settled();

    assert.dom(getPopover()).hasAttribute('data-show', 'false');
  });
});
