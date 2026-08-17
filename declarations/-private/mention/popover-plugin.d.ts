import type { MentionConfig } from './types.ts';
import type { Ctx, MilkdownPlugin } from '@milkdown/kit/ctx';
export declare const mentionConfigCtx: import("@milkdown/kit/utils").$Ctx<MentionConfig, "mentionEmberConfig">;
export declare const mentionSlash: import("@milkdown/kit/plugin/slash").SlashPlugin<"MILKDOWN_EMBER_MENTION", any>;
export declare function configureMentionPopover(ctx: Ctx): void;
export declare const mentionFeaturePlugins: MilkdownPlugin[];
//# sourceMappingURL=popover-plugin.d.ts.map