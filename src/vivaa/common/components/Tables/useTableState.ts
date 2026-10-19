// ───────────────────────────────────────────────────────────────────────────
// REDUCED (not synced) from VivaaHealth/vivaa @ a6cb2997cc4b
// Source: web/common/src/components/Tables/useTableState.ts
// Same types and return shape as upstream. One difference: the page size lives in React state
// instead of upstream's `useBrowserStorage` localStorage wrapper (which pulls in zod and the
// browserStorage module). Behaviour within a session is identical.
// ───────────────────────────────────────────────────────────────────────────

import { type GridPaginationModel, type GridSortModel } from '@mui/x-data-grid';
import { type Dispatch, type SetStateAction, useCallback, useMemo, useState } from 'react';

import { type RowsPerPage } from './utils';

export interface TablePaginationProps {
  paginationModel: GridPaginationModel;
  setPaginationModel: Dispatch<SetStateAction<GridPaginationModel>>;
  goToFirstPage: () => void;
}

export interface TableSortProps {
  sortModel: GridSortModel;
  setSortModel: (sortModel: GridSortModel) => void;
}

export interface UseStateAwareTableSortProps {
  sortModel: GridSortModel;
  setSortModel: Dispatch<SetStateAction<GridSortModel>>;
}

interface UseTableStateProps {
  localStorageKeySuffix?: string;
  defaultPageSize?: RowsPerPage;
  defaultSortModel?: GridSortModel;
}

export function useTableState(props?: UseTableStateProps) {
  const { defaultPageSize, defaultSortModel } = props ?? {};
  const [pageSize, setPageSize] = useState<number>(defaultPageSize ?? 100);
  const [page, setPage] = useState<GridPaginationModel['page']>(0);

  const [sortModel, setSortModel] = useState<GridSortModel>(defaultSortModel ?? []);

  const paginationModel = useMemo<GridPaginationModel>(() => {
    return {
      pageSize,
      page,
    };
  }, [page, pageSize]);

  const setPaginationModel = useCallback(
    (modelOrUpdateFunction: GridPaginationModel | SetStateAction<GridPaginationModel>) => {
      if (typeof modelOrUpdateFunction === 'function') {
        setPage((prevPage) => {
          const prevModel = {
            pageSize,
            page: prevPage,
          };
          const newModel = modelOrUpdateFunction(prevModel);
          if (newModel.pageSize !== undefined) {
            setPageSize(newModel.pageSize);
          }
          return newModel.page;
        });
        return;
      }
      setPage(modelOrUpdateFunction.page);
      setPageSize(modelOrUpdateFunction.pageSize);
    },
    [pageSize]
  );
  const pageOffset = page * pageSize;

  const goToFirstPage = useCallback(() => {
    setPage(0);
  }, []);
  const pagination: TablePaginationProps = {
    paginationModel,
    setPaginationModel,
    goToFirstPage,
  };

  const sort: UseStateAwareTableSortProps = {
    sortModel,
    setSortModel,
  };

  return {
    pagination,
    paginationModel,
    sort,
    setPaginationModel,
    ...paginationModel,
    pageOffset,
    goToFirstPage,
  };
}
