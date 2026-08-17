import { $ctx } from '@milkdown/kit/utils';

import type { DiffToggleConfig } from './types.ts';

export const diffToggleCtx = $ctx<DiffToggleConfig, 'diffEmberToggle'>(
  { onToggle: () => {} },
  'diffEmberToggle',
);
