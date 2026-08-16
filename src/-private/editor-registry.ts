import type { CrepeSyncManager } from './crepe-sync-manager.ts';

/// Maps a mounted editor's root element back to the manager that owns it.
/// Exists only so `test-support.ts` can reach the live Crepe/ProseMirror
/// instance for driving realistic edits in tests; nothing in the public
/// component/modifier API depends on this.
const registry = new WeakMap<Element, CrepeSyncManager>();

export function registerEditor(root: Element, manager: CrepeSyncManager): void {
  registry.set(root, manager);
}

export function unregisterEditor(root: Element): void {
  registry.delete(root);
}

export function lookupEditor(root: Element): CrepeSyncManager | undefined {
  return registry.get(root);
}
