// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 133077f94753
// Source:     web/common/src/components/Tables/NoRecords.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/133077f947534133a16b632ac3575c94693357d7/web/common/src/components/Tables/NoRecords.tsx
// Ref:        main (upstream commit 2026-08-14)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// Rewrites:   '../../utils/types' → '../../utils/isDefined.js'
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { Stack } from '@mui/material';
import type { ReactNode } from 'react';

import { isDefined } from '../../utils/isDefined.js';
import { Text } from '../Typography';

export interface NoRecordsOverlayCustomMessage {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}

interface NoRecordsOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  customMessage?: NoRecordsOverlayCustomMessage;
}

export function NoRecordsOverlay(props: NoRecordsOverlayProps) {
  const { customMessage, ...restProps } = props;
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      sx={{
        height: '100%',
        padding: 4,
      }}
      {...restProps}
    >
      <Stack
        spacing={2}
        sx={{
          alignItems: 'center',
        }}
      >
        <Stack gap={1} alignItems="center">
          <Text variant="heading4" bold>
            {customMessage?.title ?? 'No items found'}
          </Text>
          {isDefined(customMessage?.description) && (
            <Text variant="body2">{customMessage.description}</Text>
          )}
        </Stack>
        {isDefined(customMessage?.action) ? customMessage.action : null}
      </Stack>
    </Stack>
  );
}
