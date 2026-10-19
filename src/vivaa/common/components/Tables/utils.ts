// ───────────────────────────────────────────────────────────────────────────
// REDUCED (not synced) from VivaaHealth/vivaa @ a6cb2997cc4b
// Source: web/common/src/components/Tables/utils.ts
// Only the pieces NotableDataGrid and this prototype use, copied verbatim. Dropped: the zod
// `RowsPerPageSchema` and the server-pagination helpers that depend on `vivaa-api`.
// ───────────────────────────────────────────────────────────────────────────

import { type GridPaginationModel } from '@mui/x-data-grid';

import { isDefined } from '../../utils/isDefined.js';

export const ROWS_PER_PAGE_OPTIONS = [5, 25, 50, 100, 250, 500];

export const UNKNOWN_ROW_COUNT = -1;

// Must match ROWS_PER_PAGE_OPTIONS
export type RowsPerPage = 5 | 25 | 50 | 100 | 250 | 500;

export function getEstimatedRowCount(
  data: unknown[] | undefined,
  paginationModel: GridPaginationModel
): number {
  const { pageSize, page } = paginationModel;
  return isDefined(data) && data.length < pageSize
    ? data.length + page * pageSize
    : UNKNOWN_ROW_COUNT;
}

export function formatPaginationDisplayedRows(options: {
  from: number;
  to: number;
  count: number;
  estimated?: number;
}): string {
  const { from, to, count, estimated: estimatedCount } = options;
  if (count !== UNKNOWN_ROW_COUNT) {
    return `${from}–${to} of ${count}`;
  }
  if (isDefined(estimatedCount)) {
    return `${from}–${to} of more than ${Math.max(estimatedCount, to)}`;
  }
  return `${from}–${to}`;
}
