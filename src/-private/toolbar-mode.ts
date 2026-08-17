import { CrepeFeature } from '@milkdown/crepe';

import type { Crepe } from '@milkdown/crepe';

export type ToolbarMode = 'floating' | 'static';

/// Maps our public toolbar mode to Crepe's own feature flags. Crepe merges
/// this over its defaults, so every other feature (BlockEdit, ListItem,
/// LinkTooltip, ...) keeps its default value, only Toolbar/TopBar are
/// overridden here.
export function featuresForToolbarMode(
  mode: ToolbarMode,
): NonNullable<ConstructorParameters<typeof Crepe>[0]>['features'] {
  return {
    [CrepeFeature.Toolbar]: mode === 'floating',
    [CrepeFeature.TopBar]: mode === 'static',
  };
}
