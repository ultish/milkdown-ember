import { mentionSchema, insertMentionCommand } from './schema.js';
import { mentionConfigCtx, configureMentionPopover, mentionFeaturePlugins } from './popover-plugin.js';

/// Registers the mention node schema and its trigger-driven suggestion
/// popover onto a not-yet-created Crepe editor. Call before `crepe.create()`.
function registerMentionFeature(editor, config) {
  editor.config(ctx => {
    ctx.set(mentionConfigCtx.key, config);
    configureMentionPopover(ctx);
  }).use(mentionSchema).use(insertMentionCommand).use(mentionFeaturePlugins);
}

export { registerMentionFeature };
//# sourceMappingURL=feature.js.map
