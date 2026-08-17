import { computeDocDiff } from '@milkdown/kit/plugin/diff';

function overlaps(a, b) {
  return a.from < b.to && a.to > b.from;
}

/// Highlights at the top-level-block granularity (paragraph, heading, list
/// item, ...), not word-level: the two panes are independent, unaligned
/// renders, so there's no shared position space to hang finer-grained
/// decorations on the way inline mode's single live doc has. A changed
/// block is one that overlaps any change range `computeDocDiff` reports
/// for that side.
function blocksWithChangeFlags(doc, changeRanges) {
  const blocks = [];
  doc.forEach((node, offset) => {
    const range = {
      from: offset,
      to: offset + node.nodeSize
    };
    blocks.push({
      text: node.textContent,
      changed: changeRanges.some(r => overlaps(range, r))
    });
  });
  return blocks;
}
function computeSideBySideBlocks(oldDoc, newDoc) {
  const changes = computeDocDiff(oldDoc, newDoc);
  const oldRanges = changes.map(c => ({
    from: c.fromA,
    to: c.toA
  }));
  const newRanges = changes.map(c => ({
    from: c.fromB,
    to: c.toB
  }));
  return {
    oldBlocks: blocksWithChangeFlags(oldDoc, oldRanges),
    newBlocks: blocksWithChangeFlags(newDoc, newRanges)
  };
}

export { computeSideBySideBlocks };
//# sourceMappingURL=side-by-side-blocks.js.map
