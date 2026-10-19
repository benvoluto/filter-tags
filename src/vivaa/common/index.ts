// ───────────────────────────────────────────────────────────────────────────
// LOCAL barrel standing in for vivaa's `common` package (web/common/src/index.ts).
// tsconfig maps the bare specifier `common` here, so synced staff files keep their upstream
// `import { colors, isDefined } from 'common'` lines unchanged. Exports only what this prototype
// syncs; everything it re-exports is upstream code (synced, or adapted with its edits listed).
// ───────────────────────────────────────────────────────────────────────────

// Side-effect import that pulls the MUI theme augmentation into the program, as upstream does.
import './styled.js';

export * from './theme/index.js';
export { isDefined, isTruthy } from './utils/isDefined.js';
export { mergeSxProps } from './components/Mui/mergeSxProps.js';
export { Span } from './components/Span/Span.js';
export { Tag, type TagColor, type TagProps } from './components/Tag/Tag.js';
export { Text, Title, type TextProps, type TitleProps } from './components/Typography/index.js';
export { NotableDataGrid } from './components/Tables/DataGrid';
export { NoRecordsOverlay } from './components/Tables/NoRecords';
export {
  useTableState,
  type TablePaginationProps,
  type TableSortProps,
} from './components/Tables/useTableState';
export {
  ROWS_PER_PAGE_OPTIONS,
  UNKNOWN_ROW_COUNT,
  formatPaginationDisplayedRows,
  getEstimatedRowCount,
  type RowsPerPage,
} from './components/Tables/utils';
