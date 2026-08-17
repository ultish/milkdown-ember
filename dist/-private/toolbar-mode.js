import { CrepeFeature } from '@milkdown/crepe';

/// Maps our public toolbar mode to Crepe's own feature flags. Crepe merges
/// this over its defaults, so every other feature (BlockEdit, ListItem,
/// LinkTooltip, ...) keeps its default value, only Toolbar/TopBar are
/// overridden here.
function featuresForToolbarMode(mode) {
  return {
    [CrepeFeature.Toolbar]: mode === 'floating',
    [CrepeFeature.TopBar]: mode === 'static'
  };
}

export { featuresForToolbarMode };
//# sourceMappingURL=toolbar-mode.js.map
