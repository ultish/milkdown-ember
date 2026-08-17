import { insertMentionCommand, mentionSchema } from './schema.ts';
import {
  configureMentionPopover,
  mentionConfigCtx,
  mentionFeaturePlugins,
} from './popover-plugin.ts';

import type { MentionConfig } from './types.ts';
import type { Editor } from '@milkdown/kit/core';

/// Registers the mention node schema and its trigger-driven suggestion
/// popover onto a not-yet-created Crepe editor. Call before `crepe.create()`.
export function registerMentionFeature(
  editor: Editor,
  config: MentionConfig,
): void {
  editor
    .config((ctx) => {
      ctx.set(mentionConfigCtx.key, config);
      configureMentionPopover(ctx);
    })
    .use(mentionSchema)
    .use(insertMentionCommand)
    .use(mentionFeaturePlugins);
}

export type {
  MentionCandidate,
  MentionConfig,
  MentionSearch,
} from './types.ts';
