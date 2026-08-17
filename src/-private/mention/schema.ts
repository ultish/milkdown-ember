import { $command, $nodeSchema } from '@milkdown/kit/utils';

import type { Node as ProseNode } from '@milkdown/kit/prose/model';

/// Encodes a mention as a markdown link with a `mention:` URL scheme,
/// e.g. `[@Ada Lovelace](mention:user-42)`, rather than inventing a bare
/// `@word` syntax. This reuses remark's existing, already-tested link
/// parsing instead of a custom micromark grammar, and degrades gracefully:
/// rendered by any plain markdown viewer, it still reads as a link with
/// the person's name rather than raw unparsed syntax.
const MENTION_URL_SCHEME = 'mention:';

function mentionUrl(id: string): string {
  return `${MENTION_URL_SCHEME}${encodeURIComponent(id)}`;
}

function mentionIdFromUrl(url: string): string | undefined {
  if (!url.startsWith(MENTION_URL_SCHEME)) return undefined;
  return decodeURIComponent(url.slice(MENTION_URL_SCHEME.length));
}

interface MdastTextChild {
  type: string;
  value?: string;
}

interface MdastLinkNode {
  type: string;
  url: string;
  children?: MdastTextChild[];
}

/// The stored `label` attr never includes this; it's added at display time
/// only, in both `toDOM` and the markdown link's visible text (below), so
/// a mention always reads as "@Name" regardless of what trigger character
/// was actually configured for search.
const DISPLAY_PREFIX = '@';

function stripDisplayPrefix(text: string): string {
  return text.startsWith(DISPLAY_PREFIX)
    ? text.slice(DISPLAY_PREFIX.length)
    : text;
}

function labelFromLinkChildren(node: MdastLinkNode): string {
  const text = node.children
    ?.map((child) => child.value ?? '')
    .join('')
    .trim();
  return text && text.length > 0
    ? stripDisplayPrefix(text)
    : (mentionIdFromUrl(node.url) ?? '');
}

export const mentionSchema = $nodeSchema('mention', () => ({
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,
  draggable: false,
  marks: '',
  attrs: {
    id: { validate: 'string' },
    label: { validate: 'string' },
  },
  parseDOM: [
    {
      tag: 'span[data-mention-id]',
      getAttrs: (dom) => {
        if (!(dom instanceof HTMLElement)) return false;
        const id = dom.getAttribute('data-mention-id');
        if (!id) return false;
        return { id, label: stripDisplayPrefix(dom.textContent ?? id) };
      },
    },
  ],
  toDOM: (node) => [
    'span',
    { 'data-mention-id': node.attrs.id as string },
    `${DISPLAY_PREFIX}${node.attrs.label as string}`,
  ],
  parseMarkdown: {
    match: (node) => {
      const link = node as unknown as MdastLinkNode;
      return link.type === 'link' && mentionIdFromUrl(link.url) !== undefined;
    },
    runner: (state, node, type) => {
      const link = node as unknown as MdastLinkNode;
      const id = mentionIdFromUrl(link.url);
      if (id === undefined) return;
      state.addNode(type, { id, label: labelFromLinkChildren(link) });
    },
  },
  toMarkdown: {
    match: (node) => node.type.name === 'mention',
    runner: (state, node) => {
      state.addNode(
        'link',
        [
          {
            type: 'text',
            value: `${DISPLAY_PREFIX}${node.attrs.label as string}`,
          },
        ],
        undefined,
        { url: mentionUrl(node.attrs.id as string) },
      );
    },
  },
}));

export interface InsertMentionPayload {
  id: string;
  label: string;
  /// Replace this range (typically the "@query" text just typed) instead
  /// of the current selection. Both ends are absolute doc positions.
  range?: { from: number; to: number };
}

/// Mirrors the commonmark preset's own `insertImageCommand` shape: create
/// the node and either replace the current selection or a given range.
export const insertMentionCommand = $command(
  'InsertMention',
  (ctx) => (payload?: InsertMentionPayload) => (state, dispatch) => {
    if (!payload) return false;

    const node: ProseNode | null = mentionSchema
      .type(ctx)
      .create({ id: payload.id, label: payload.label });
    if (!node) return false;

    if (dispatch) {
      const { from, to } = payload.range ?? {
        from: state.selection.from,
        to: state.selection.to,
      };
      dispatch(state.tr.replaceWith(from, to, node).scrollIntoView());
    }
    return true;
  },
);
