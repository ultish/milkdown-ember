/// Maps a mounted editor's root element back to the manager that owns it.
/// Exists only so `test-support.ts` can reach the live Crepe/ProseMirror
/// instance for driving realistic edits in tests; nothing in the public
/// component/modifier API depends on this.
const registry = new WeakMap();
function registerEditor(root, manager) {
  registry.set(root, manager);
}
function unregisterEditor(root) {
  registry.delete(root);
}
function lookupEditor(root) {
  return registry.get(root);
}

export { lookupEditor, registerEditor, unregisterEditor };
//# sourceMappingURL=editor-registry.js.map
