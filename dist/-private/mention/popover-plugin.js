import { commandsCtx } from '@milkdown/kit/core';
import { slashFactory, SlashProvider } from '@milkdown/kit/plugin/slash';
import { findParentNode } from '@milkdown/kit/prose';
import { TextSelection } from '@milkdown/kit/prose/state';
import { $ctx } from '@milkdown/kit/utils';
import { insertMentionCommand } from './schema.js';

const DEFAULT_TRIGGER = '@';
const mentionConfigCtx = $ctx({
  onSearch: () => [],
  trigger: DEFAULT_TRIGGER
}, 'mentionEmberConfig');

/// `slashFactory` returns `[ctxSlice, prosePlugin]`: the prose plugin reads
/// whatever ProseMirror `PluginSpec` (view/props/...) is set on the ctx
/// slice at `mentionSlash.key`, via `configureMentionPopover` below. This
/// mirrors how Crepe's own block-edit slash menu (`slashFactory('CREPE_MENU')`)
/// and `configureMenu()` are wired.
const mentionSlash = slashFactory('MILKDOWN_EMBER_MENTION');
class MentionPopoverView {
  #ctx;
  #element;
  #list;
  #provider;
  #active;
  #candidates = [];
  #highlighted = 0;
  #searchToken = 0;
  constructor(ctx, view) {
    this.#ctx = ctx;
    this.#element = document.createElement('div');
    this.#element.setAttribute('data-milkdown-ember-mention-popover', '');
    this.#list = document.createElement('ul');
    this.#element.appendChild(this.#list);

    // No `trigger` option: our own shouldShow below extracts the query
    // text itself, which the built-in last-char-only trigger check can't
    // do (it stops matching after the first character typed past "@").
    // Low debounce (vs. SlashProvider's 200ms default): BlockEdit's own
    // slash menu uses 20ms for the same reason, positioning should track
    // typing closely once we've already decided to show.
    this.#provider = new SlashProvider({
      content: this.#element,
      debounce: 20,
      shouldShow: v => this.#computeActiveQuery(v) !== undefined
    });
    this.#provider.onHide = () => {
      this.#active = undefined;
      this.#candidates = [];
      this.#renderList();
    };
    this.update(view);
  }
  update = view => {
    this.#provider.update(view);
    const current = this.#computeActiveQuery(view);
    const previousQuery = this.#active?.query;
    this.#active = current;
    if (!current) return;
    if (current.query !== previousQuery) void this.#runSearch(current.query);
  };
  destroy = () => {
    this.#provider.destroy();
    this.#element.remove();
  };

  /// Only intercepts when the popover is showing; every other keymap in
  /// the editor keeps working otherwise.
  handleKeyDown = (_view, event) => {
    if (!this.#active || this.#candidates.length === 0) return false;
    if (event.key === 'ArrowDown') {
      this.#highlighted = (this.#highlighted + 1) % this.#candidates.length;
      this.#renderList();
      return true;
    }
    if (event.key === 'ArrowUp') {
      this.#highlighted = (this.#highlighted - 1 + this.#candidates.length) % this.#candidates.length;
      this.#renderList();
      return true;
    }
    if (event.key === 'Enter' || event.key === 'Tab') {
      const candidate = this.#candidates[this.#highlighted];
      if (candidate) this.#select(candidate);
      return true;
    }
    if (event.key === 'Escape') {
      this.#provider.hide();
      return true;
    }
    return false;
  };

  /// Finds the nearest unclosed trigger before the cursor in the current
  /// text block, e.g. "hello @ada" -> { query: "ada", from: <@'s pos> }.
  /// A trigger followed by whitespace, or with none typed after it in the
  /// current run, ends the mention attempt (returns undefined).
  #computeActiveQuery(view) {
    const {
      selection
    } = view.state;
    if (!(selection instanceof TextSelection) || !selection.empty) return undefined;
    if (!view.hasFocus()) return undefined;
    const {
      $from
    } = selection;
    const paragraph = findParentNode(node => ['paragraph', 'heading'].includes(node.type.name))(selection);
    if (!paragraph) return undefined;
    const trigger = this.#ctx.get(mentionConfigCtx.key).trigger ?? DEFAULT_TRIGGER;
    const textBefore = $from.parent.textBetween(Math.max(0, $from.parentOffset - 500), $from.parentOffset, undefined, '￼');
    const triggerIndex = textBefore.lastIndexOf(trigger);
    if (triggerIndex === -1) return undefined;
    const afterTrigger = textBefore.slice(triggerIndex + trigger.length);
    if (/\s/.test(afterTrigger)) return undefined;
    const from = $from.pos - (textBefore.length - triggerIndex);
    return {
      from,
      to: $from.pos,
      query: afterTrigger
    };
  }
  async #runSearch(query) {
    const token = ++this.#searchToken;
    const {
      onSearch
    } = this.#ctx.get(mentionConfigCtx.key);
    const results = await onSearch(query);
    if (token !== this.#searchToken) return; // a newer search superseded this one

    this.#candidates = results;
    this.#highlighted = 0;
    this.#renderList();
  }
  #select(candidate) {
    const active = this.#active;
    if (!active) return;
    this.#ctx.get(commandsCtx).call(insertMentionCommand.key, {
      id: candidate.id,
      label: candidate.label,
      range: {
        from: active.from,
        to: active.to
      }
    });
    this.#provider.hide();
  }
  #renderList() {
    this.#list.replaceChildren();
    this.#candidates.forEach((candidate, index) => {
      const item = document.createElement('li');
      item.textContent = candidate.label;
      item.setAttribute('data-mention-candidate', '');
      item.setAttribute('data-index', String(index));
      if (index === this.#highlighted) item.setAttribute('data-active', '');
      item.addEventListener('mousedown', event => {
        // mousedown, not click: fires before the editor's own selection
        // handling would otherwise steal focus and close the popover first.
        event.preventDefault();
        this.#select(candidate);
      });
      this.#list.appendChild(item);
    });
  }
}

/// Wires the actual PluginSpec (view + handleKeyDown) onto the slash
/// plugin's ctx slice. Call from an `Editor#config` callback, alongside
/// setting `mentionConfigCtx`, before the editor is created.
function configureMentionPopover(ctx) {
  let popover;
  ctx.set(mentionSlash.key, {
    view: view => {
      popover = new MentionPopoverView(ctx, view);
      return {
        update: v => popover?.update(v),
        destroy: () => popover?.destroy()
      };
    },
    props: {
      handleKeyDown: (view, event) => popover?.handleKeyDown(view, event) ?? false
    }
  });
}
const mentionFeaturePlugins = [mentionConfigCtx, ...mentionSlash];

export { configureMentionPopover, mentionConfigCtx, mentionFeaturePlugins, mentionSlash };
//# sourceMappingURL=popover-plugin.js.map
