import { $nodeSchema, $command } from '@milkdown/kit/utils';

/// Encodes a mention as a markdown link with a `mention:` URL scheme,
/// e.g. `[@Ada Lovelace](mention:user-42)`, rather than inventing a bare
/// `@word` syntax. This reuses remark's existing, already-tested link
/// parsing instead of a custom micromark grammar, and degrades gracefully:
/// rendered by any plain markdown viewer, it still reads as a link with
/// the person's name rather than raw unparsed syntax.
const MENTION_URL_SCHEME = 'mention:';
function mentionUrl(id) {
  return `${MENTION_URL_SCHEME}${encodeURIComponent(id)}`;
}
function mentionIdFromUrl(url) {
  if (!url.startsWith(MENTION_URL_SCHEME)) return undefined;
  return decodeURIComponent(url.slice(MENTION_URL_SCHEME.length));
}
/// The stored `label` attr never includes this; it's added at display time
/// only, in both `toDOM` and the markdown link's visible text (below), so
/// a mention always reads as "@Name" regardless of what trigger character
/// was actually configured for search.
const DISPLAY_PREFIX = '@';
function stripDisplayPrefix(text) {
  return text.startsWith(DISPLAY_PREFIX) ? text.slice(DISPLAY_PREFIX.length) : text;
}
function labelFromLinkChildren(node) {
  const text = node.children?.map(child => child.value ?? '').join('').trim();
  return text && text.length > 0 ? stripDisplayPrefix(text) : mentionIdFromUrl(node.url) ?? '';
}
const mentionSchema = $nodeSchema('mention', () => ({
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,
  marks: '',
  attrs: {
    id: {
      validate: 'string'
    },
    label: {
      validate: 'string'
    }
  },
  parseDOM: [{
    tag: 'span[data-mention-id]',
    getAttrs: dom => {
      if (!(dom instanceof HTMLElement)) return false;
      const id = dom.getAttribute('data-mention-id');
      if (!id) return false;
      return {
        id,
        label: stripDisplayPrefix(dom.textContent ?? id)
      };
    }
  }],
  toDOM: node => ['span', {
    'data-mention-id': node.attrs.id
  }, `${DISPLAY_PREFIX}${node.attrs.label}`],
  parseMarkdown: {
    match: node => {
      const link = node;
      return link.type === 'link' && mentionIdFromUrl(link.url) !== undefined;
    },
    runner: (state, node, type) => {
      const link = node;
      const id = mentionIdFromUrl(link.url);
      if (id === undefined) return;
      state.addNode(type, {
        id,
        label: labelFromLinkChildren(link)
      });
    }
  },
  toMarkdown: {
    match: node => node.type.name === 'mention',
    runner: (state, node) => {
      state.addNode('link', [{
        type: 'text',
        value: `${DISPLAY_PREFIX}${node.attrs.label}`
      }], undefined, {
        url: mentionUrl(node.attrs.id)
      });
    }
  }
}));
/// Mirrors the commonmark preset's own `insertImageCommand` shape: create
/// the node and either replace the current selection or a given range.
const insertMentionCommand = $command('InsertMention', ctx => payload => (state, dispatch) => {
  if (!payload) return false;
  const node = mentionSchema.type(ctx).create({
    id: payload.id,
    label: payload.label
  });
  if (!node) return false;
  if (dispatch) {
    const {
      from,
      to
    } = payload.range ?? {
      from: state.selection.from,
      to: state.selection.to
    };
    dispatch(state.tr.replaceWith(from, to, node).scrollIntoView());
  }
  return true;
});

export { insertMentionCommand, mentionSchema };
//# sourceMappingURL=schema.js.map
