import { lookupEditor } from './-private/editor-registry.js';

/// Types into a mounted `<MilkdownEditor>` (or the `milkdownEditorModifier`
/// applied directly) by dispatching a real ProseMirror transaction, rather
/// than simulating the DOM input event that would normally produce it.
/// Simulating that event reliably across browsers isn't practical for a
/// contenteditable surface, and re-verifying it isn't this addon's job,
/// Milkdown already tests that ProseMirror translates real keystrokes into
/// doc changes correctly.
///
/// `root` is the element the modifier is applied to (or that contains it),
/// i.e. `document.querySelector('[data-milkdown-ember-editor]')`.
function typeIntoMilkdownEditor(root, text) {
  const manager = lookupEditor(root);
  if (!manager) {
    throw new Error('typeIntoMilkdownEditor: no milkdown-ember editor is mounted on this element');
  }
  manager.insertTextForTest(text);
}

export { typeIntoMilkdownEditor };
//# sourceMappingURL=test-support.js.map
