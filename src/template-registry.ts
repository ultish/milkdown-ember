// Easily allow apps, which are not yet using strict mode templates, to consume your Glint types, by importing this file.
// Add all your components, helpers and modifiers to the template registry here, so apps don't have to do this.
// See https://typed-ember.gitbook.io/glint/environments/ember/authoring-addons

import type MilkdownEditor from './components/milkdown-editor.gts';
import type milkdownEditorModifier from './modifiers/milkdown-editor.ts';

export default interface Registry {
  MilkdownEditor: typeof MilkdownEditor;
  milkdownEditorModifier: typeof milkdownEditorModifier;
}
