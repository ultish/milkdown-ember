import { computeDocDiff } from '@milkdown/kit/plugin/diff';

import type { Node as ProseNode } from '@milkdown/kit/prose/model';

export interface DiffBlock {
  text: string;
  changed: boolean;
}

interface Range {
  from: number;
  to: number;
}

function overlaps(a: Range, b: Range): boolean {
  return a.from < b.to && a.to > b.from;
}

/// Highlights at the top-level-block granularity (paragraph, heading, list
/// item, ...), not word-level: the two panes are independent, unaligned
/// renders, so there's no shared position space to hang finer-grained
/// decorations on the way inline mode's single live doc has. A changed
/// block is one that overlaps any change range `computeDocDiff` reports
/// for that side.
function blocksWithChangeFlags(
  doc: ProseNode,
  changeRanges: Range[],
): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  doc.forEach((node, offset) => {
    const range: Range = { from: offset, to: offset + node.nodeSize };
    blocks.push({
      text: node.textContent,
      changed: changeRanges.some((r) => overlaps(range, r)),
    });
  });
  return blocks;
}

export interface SideBySideBlocks {
  oldBlocks: DiffBlock[];
  newBlocks: DiffBlock[];
}

export function computeSideBySideBlocks(
  oldDoc: ProseNode,
  newDoc: ProseNode,
): SideBySideBlocks {
  const changes = computeDocDiff(oldDoc, newDoc);
  const oldRanges = changes.map((c) => ({ from: c.fromA, to: c.toA }));
  const newRanges = changes.map((c) => ({ from: c.fromB, to: c.toB }));
  return {
    oldBlocks: blocksWithChangeFlags(oldDoc, oldRanges),
    newBlocks: blocksWithChangeFlags(newDoc, newRanges),
  };
}
