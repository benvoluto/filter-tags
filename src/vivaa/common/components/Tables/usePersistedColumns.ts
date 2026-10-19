// ───────────────────────────────────────────────────────────────────────────
// REDUCED (not synced) from VivaaHealth/vivaa @ a6cb2997cc4b
// Source: web/common/src/components/Tables/usePersistedColumns.ts
// Only upstream's disabled branch (`tableId` undefined), which is what every NotableDataGrid
// without a `tablePersistenceId` gets. Persistence needs the browserStorage module and isn't
// part of the filter prototype.
// ───────────────────────────────────────────────────────────────────────────

import {
  type GridApiCommon,
  type GridColDef,
  type GridColumnOrderChangeParams,
  type GridColumnResizeParams,
  type GridColumnVisibilityModel,
  type GridValidRowModel,
} from '@mui/x-data-grid';
import { type RefObject } from 'react';

interface UsePersistedColumnsProps<TRow extends GridValidRowModel> {
  tableId: string | undefined;
  apiRef: RefObject<GridApiCommon | null>;
  columns: readonly GridColDef<TRow>[];
  initialColumnVisibilityModel: GridColumnVisibilityModel | undefined;
}

interface UsePersistedColumnsResult<TRow extends GridValidRowModel> {
  columns: readonly GridColDef<TRow>[];
  columnVisibilityModel: GridColumnVisibilityModel | undefined;
  onColumnOrderChange: ((params: GridColumnOrderChangeParams) => void) | undefined;
  onColumnWidthChange: ((params: GridColumnResizeParams) => void) | undefined;
  onColumnVisibilityModelChange: ((model: GridColumnVisibilityModel) => void) | undefined;
}

export function usePersistedColumns<TRow extends GridValidRowModel>(
  props: UsePersistedColumnsProps<TRow>
): UsePersistedColumnsResult<TRow> {
  const { columns } = props;
  return {
    columns,
    columnVisibilityModel: undefined,
    onColumnOrderChange: undefined,
    onColumnWidthChange: undefined,
    onColumnVisibilityModelChange: undefined,
  };
}
