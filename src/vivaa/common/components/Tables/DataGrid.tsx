// ───────────────────────────────────────────────────────────────────────────
// ADAPTED (not synced) from VivaaHealth/vivaa @ a6cb2997cc4b
// Source: web/common/src/components/Tables/DataGrid.tsx
//
// This public repo carries no MUI X Pro licence, so the grid is the MIT `DataGrid`. It renders the
// same DOM and class names, so every style below is upstream's, unchanged. The whole list of edits:
//   • `DataGridPro`/`DataGridProProps` → `DataGrid`/`DataGridProps` from '@mui/x-data-grid'
//     (aliased back to the Pro names below so the body stays a verbatim copy).
//   • Pro-only props dropped: `disableColumnPinning`, `treeData`, `getTreeDataPath`,
//     `groupingColDef`, `defaultGroupingExpansionDepth`, `checkboxSelectionVisibleOnly`
//     (no Pro features are used here; the prototype has no row selection).
//   • `pagination={… || undefined}`: the MIT grid types `pagination` as `true` only.
//   • Imports resolve to the local `./usePersistedColumns`, `./useTableState`, `./utils` shims and
//     `../../utils/isDefined.js` instead of `../../utils/types`.
// In flow-studio-lite (which has the licence) use its own `ui/notable-data-grid.tsx`.
// ───────────────────────────────────────────────────────────────────────────

import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { Box, type BoxProps } from '@mui/material';
import {
  DataGrid as DataGridPro,
  type DataGridProps as DataGridProProps,
  type GridValidRowModel,
  gridClasses,
  useGridApiRef,
} from '@mui/x-data-grid';

import { NoRecordsOverlay } from './NoRecords';
import { usePersistedColumns } from './usePersistedColumns';
import { type TablePaginationProps, type TableSortProps } from './useTableState';
import { ROWS_PER_PAGE_OPTIONS, formatPaginationDisplayedRows } from './utils';
import { colors } from '../../theme/index.js';
import { isDefined } from '../../utils/isDefined.js';

const EVEN_ROW_CLASS_NAME = 'NotableDataGridEvenRow';
const ODD_ROW_CLASS_NAME = 'NotableDataGridOddRow';

type AllowedDataGridProps<TRowModel extends GridValidRowModel> = Pick<
  DataGridProProps<TRowModel>,
  | 'columns'
  // | 'onRowClick' // Currently typed with `any` in DataGridPro v5
  | 'onCellClick'
  | 'initialState'
  | 'onSortModelChange'
  | 'sortModel'
  | 'checkboxSelection'
  | 'rowSelectionModel'
  | 'onRowSelectionModelChange'
  | 'isRowSelectable'
  | 'disableRowSelectionOnClick'
  | 'slots'
  | 'slotProps'
  | 'disableColumnMenu'
  | 'getRowClassName'
  | 'showToolbar'
  | 'disableVirtualization'
  | 'pageSizeOptions'
  | 'getRowId'
  | 'processRowUpdate'
  | 'apiRef'
  | 'localeText'
>;

type ManualColumnStateProps<TRowModel extends GridValidRowModel> = Pick<
  DataGridProProps<TRowModel>,
  | 'columnVisibilityModel'
  | 'onColumnVisibilityModelChange'
  | 'onColumnWidthChange'
  | 'onColumnOrderChange'
>;

type ColumnPersistenceProps<TRowModel extends GridValidRowModel> =
  | ({
      /**
       * Opt-in per-user persistence of column visibility, order, and width. Each consuming app
       * owns its own enum of ids so that two tables cannot collide on a storage key.
       *
       * Known issue on Linux/Wayland: compositor blur/focus events during a native column drag
       * trigger a React context update that re-renders the page mid-gesture. MUI resets its
       * drag tracking when `columns` gets a new reference, causing the column to snap back on
       * drop. Memoizing `columns` would fix this, but we are deferring to React 19,
       * which will likely stabilize references automatically.
       */
      tablePersistenceId: string;
    } & { [Key in keyof ManualColumnStateProps<TRowModel>]?: never })
  | ({ tablePersistenceId?: undefined } & ManualColumnStateProps<TRowModel>);

interface BaseNotableDataGridProps<
  TRowModel extends GridValidRowModel,
> extends AllowedDataGridProps<TRowModel> {
  isPending: boolean;
  data: TRowModel[] | undefined;
  /**
   * DataGrid requires a fixed height for virtualization to work.
   * Without this, `DataGrid` can crash.
   * Default is dependent on whether we use a top bar or a sidebar and accounts for the filter bar and page layout.
   */
  height?: BoxProps['height'];
  rowCount?: DataGridProProps<TRowModel>['rowCount'];
  estimatedRowCount?: DataGridProProps<TRowModel>['estimatedRowCount'];
  onRowClick?: (params: { row: TRowModel }, event: React.MouseEvent) => void;
  pagination?: TablePaginationProps;
  sort?: TableSortProps;
  variant?: 'default' | 'striped';
  rowHeight?: 48 | 52 | 'auto';
  pageSizeOptions?: DataGridProProps<TRowModel>['pageSizeOptions'];
}

type NotableDataGridProps<TRowModel extends GridValidRowModel> =
  BaseNotableDataGridProps<TRowModel> & ColumnPersistenceProps<TRowModel>;

export function NotableDataGrid<TRowModel extends GridValidRowModel>(
  props: NotableDataGridProps<TRowModel>
) {
  const {
    isPending,
    data,
    height,
    rowCount,
    estimatedRowCount,
    columns,
    onRowClick,
    onCellClick,
    onColumnVisibilityModelChange,
    columnVisibilityModel,
    sort,
    initialState,
    pagination,
    variant,
    checkboxSelection,
    onRowSelectionModelChange,
    rowSelectionModel,
    isRowSelectable,
    disableRowSelectionOnClick,
    rowHeight,
    onColumnWidthChange,
    onColumnOrderChange,
    slots,
    getRowClassName,
    disableColumnMenu,
    showToolbar,
    disableVirtualization,
    pageSizeOptions,
    getRowId,
    processRowUpdate,
    apiRef,
    localeText,
    tablePersistenceId,
  } = props;

  const internalApiRef = useGridApiRef();
  const gridApiRef = apiRef ?? internalApiRef;
  const persistedColumns = usePersistedColumns({
    tableId: tablePersistenceId,
    apiRef: gridApiRef,
    columns,
    initialColumnVisibilityModel: initialState?.columns?.columnVisibilityModel,
  });

  return (
    <Box
      /**
       * This fixed height allows DataGrid to scroll when there are many rows, while handling virtualization of each row
       * The 200px accounts for the filter bar and page layout. (We could move this to the layout's responsibility, but we will need to ensure a fixed height is set somewhere.)
       * Note that `maxHeight` is not sufficient. It will not allow the DataGrid to scroll when there are many rows.
       */
      height={height ?? 'calc(100vh - 156px)'}
    >
      <DataGridPro<TRowModel>
        apiRef={gridApiRef}
        loading={isPending}
        disableVirtualization={disableVirtualization}
        onColumnWidthChange={persistedColumns.onColumnWidthChange ?? onColumnWidthChange}
        onColumnOrderChange={persistedColumns.onColumnOrderChange ?? onColumnOrderChange}
        processRowUpdate={processRowUpdate}
        rows={data ?? []}
        initialState={initialState}
        rowCount={rowCount}
        estimatedRowCount={estimatedRowCount}
        onRowClick={onRowClick}
        onCellClick={onCellClick}
        columns={persistedColumns.columns}
        disableColumnFilter
        disableColumnMenu={disableColumnMenu}
        disableRowSelectionOnClick={disableRowSelectionOnClick ?? true}
        columnHeaderHeight={48}
        autosizeOptions={{ expand: false }}
        getRowHeight={() => rowHeight || 'auto'}
        pagination={isDefined(pagination?.paginationModel) || undefined}
        paginationMode="server"
        paginationModel={pagination?.paginationModel}
        onPaginationModelChange={pagination?.setPaginationModel}
        pageSizeOptions={pageSizeOptions || ROWS_PER_PAGE_OPTIONS}
        onColumnVisibilityModelChange={
          persistedColumns.onColumnVisibilityModelChange ?? onColumnVisibilityModelChange
        }
        columnVisibilityModel={persistedColumns.columnVisibilityModel ?? columnVisibilityModel}
        sortingMode={isDefined(pagination?.paginationModel) ? 'server' : 'client'}
        onSortModelChange={sort?.setSortModel}
        sortModel={sort?.sortModel}
        showToolbar={showToolbar}
        slots={{
          noRowsOverlay: NoRecordsOverlay,
          // https://mui.com/x/migration/migration-data-grid-v7/#slots
          // "The icon slots now require material icons to be passed like Icon as any. Note: This is due to typing issues that might be resolved later."
          moreActionsIcon: MoreHorizIcon as any,
          ...slots,
        }}
        getRowClassName={(params) => {
          let className = '';
          if (variant === 'striped') {
            className +=
              params.indexRelativeToCurrentPage % 2 === 0
                ? EVEN_ROW_CLASS_NAME
                : ODD_ROW_CLASS_NAME;
          }
          if (isDefined(getRowClassName)) {
            className += ` ${getRowClassName(params)}`;
          }
          return className;
        }}
        checkboxSelection={checkboxSelection}
        keepNonExistentRowsSelected
        onRowSelectionModelChange={onRowSelectionModelChange}
        rowSelectionModel={rowSelectionModel}
        isRowSelectable={isRowSelectable}
        getRowId={getRowId}
        localeText={
          isDefined(pagination?.paginationModel)
            ? {
                paginationDisplayedRows: formatPaginationDisplayedRows,
                ...localeText,
              }
            : localeText
        }
        sx={{
          [`& .${gridClasses.columnHeader}`]: {
            paddingX: '8px',
            '&:focus-within': {
              outline: 'none',
            },
          },
          [`& .${gridClasses.columnHeaderTitle}`]: {
            fontWeight: 'bold',
            paddingX: '8px',
            color: colors.extended.blue[5],
          },
          [`& .${gridClasses.columnHeaderCheckbox}`]: {
            paddingLeft: '7px',
          },
          [`& .${gridClasses['cell--pinnedLeft']}`]: {
            boxShadow: '5px 0 10px -5px rgba(0, 0, 0, 0.15)',
          },
          ...(data && data.length > 0
            ? {
                [`& .${gridClasses['columnHeader--pinnedRight']}`]: {
                  boxShadow: '5px 0 10px -5px rgba(0, 0, 0, 0.15)',
                },
              }
            : {}),
          [`& .${gridClasses.virtualScrollerContent}`]: {
            [`& .${gridClasses.row}`]: {
              cursor: isDefined(onRowClick) ? 'pointer' : 'unset',
              height: rowHeight ?? 48,
              '&:not(.Mui-selected)': {
                '&:hover': {
                  backgroundColor: '#fafafa',
                  [`& .${gridClasses['cell--pinnedLeft']},.${gridClasses['cell--pinnedRight']}`]: {
                    backgroundColor: '#fafafa',
                  },
                },
                [`&.${ODD_ROW_CLASS_NAME}`]: {
                  backgroundColor: '#f6f6f6',
                  [`& .${gridClasses['cell--pinnedLeft']},.${gridClasses['cell--pinnedRight']}`]: {
                    backgroundColor: '#f6f6f6',
                  },
                  '&:hover': {
                    backgroundColor: '#f1f1f1',
                    [`& .${gridClasses['cell--pinnedLeft']},.${gridClasses['cell--pinnedRight']}`]:
                      {
                        backgroundColor: '#f1f1f1',
                      },
                  },
                },
                [`&.${EVEN_ROW_CLASS_NAME}`]: {
                  backgroundColor: '#fff',
                  [`& .${gridClasses['cell--pinnedLeft']},.${gridClasses['cell--pinnedRight']}`]: {
                    backgroundColor: '#fff',
                  },
                  '&:hover': {
                    backgroundColor: '#f1f1f1',
                    [`& .${gridClasses['cell--pinnedLeft']},.${gridClasses['cell--pinnedRight']}`]:
                      {
                        backgroundColor: '#f1f1f1',
                      },
                  },
                },
              },
            },
          },
          [`& .${gridClasses.cell}`]: {
            display: 'flex',
            alignItems: 'center',

            '&:focus-within': {
              outline: 'none',
            },
          },
          [`& .${gridClasses.scrollbarFiller}.${gridClasses.scrollbarFiller}`]: {
            backgroundColor: '#f7f7f7',
          },
          /**
           * We have variable height rows, and use `getRowHeight` to set to `auto`.
           * This means we need to manually define padding.
           *
           * Exclude `.cellEmpty` (MUI's trailing filler) so these selectors don't override
           * its `padding: 0` and give it width, which causes trailing horizontal overflow.
           */
          [`&.${gridClasses['root--densityCompact']} .${gridClasses['cell']}:not(.${gridClasses.cellEmpty})`]:
            {
              paddingY: '4px',
            },
          [`&.${gridClasses['root--densityStandard']} .${gridClasses['cell']}:not(.${gridClasses.cellEmpty})`]:
            {
              padding: '16px',
            },
          [`&.${gridClasses['root--densityComfortable']} .${gridClasses['cell']}:not(.${gridClasses.cellEmpty})`]:
            {
              paddingY: '12px',
            },
          /**
           * Bootstrap global styles set margin for p elements.
           * This is a temporary workaround to remove the margin. Remove bootstrap and refactor all p element layout to Typography.
           */
          '& .MuiTablePagination-selectLabel': {
            margin: 'unset',
          },
          '& .MuiTablePagination-displayedRows': {
            margin: 'unset',
          },
        }}
      />
    </Box>
  );
}
