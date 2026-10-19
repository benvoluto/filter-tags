// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ c0500cf3b15f
// Source:     web/staff/src/components/FiltersV2/TextSearch.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/c0500cf3b15ffd751cb6c709473de70b0f429b28/web/staff/src/components/FiltersV2/TextSearch.tsx
// Ref:        main (upstream commit 2026-10-14)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { InputAdornment, TextField } from '@mui/material';
import { MagnifyingGlassIcon } from '@phosphor-icons/react';
import { type Ref, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';

import { colors, isTruthy } from 'common';

import { FILTER_HEIGHT } from './constants';

type EditMode = 'Editing' | 'Idle';

export interface TextSearchHandle {
  /** Clears the field and the upstream value, dropping any pending debounced update. */
  clear: () => void;
}

interface TextSearchProps {
  ref?: Ref<TextSearchHandle>;
  placeholder?: string;
  initialValue: string | undefined;
  setValue: (value: string | null) => void;
  width?: number;
  helperText?: string;
  isError?: boolean;
}

export function TextSearch(props: TextSearchProps) {
  const {
    ref,
    placeholder = 'Search',
    width = 160,
    initialValue = '',
    setValue,
    helperText,
    isError,
  } = props;
  const lastInitialValueRef = useRef(initialValue);
  const [fieldValue, setFieldValue] = useState(initialValue);
  const id = useId();
  const editModeRef = useRef<EditMode>('Idle');
  const updateUpstreamValueTimeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const editModeIdleTimeoutIdRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    /**
     * If the upstream value changes, and we're not actively editing,
     * update the field value to match.
     * The common scenario is when editing the URL query param, but this could also be due to a "clear filters" button,
     * or an action that adjusts the URL or local storage filters.
     * See https://www.loom.com/share/28e8bfe16c0142b6b289fbf8b759aff6
     */
    if (editModeRef.current === 'Idle' && initialValue !== lastInitialValueRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFieldValue(initialValue);
      lastInitialValueRef.current = initialValue;
    }
  }, [initialValue]);

  useImperativeHandle(ref, () => ({
    clear: () => {
      clearTimeout(updateUpstreamValueTimeoutIdRef.current);
      updateUpstreamValueTimeoutIdRef.current = undefined;
      clearTimeout(editModeIdleTimeoutIdRef.current);
      editModeRef.current = 'Idle';
      lastInitialValueRef.current = '';
      setFieldValue('');
      setValue(null);
    },
  }));

  const updateUpstreamValue = (newValue: string) => {
    setValue(newValue || null);
    if (isTruthy(editModeIdleTimeoutIdRef.current)) {
      clearTimeout(editModeIdleTimeoutIdRef.current);
    }
    editModeIdleTimeoutIdRef.current = setTimeout(() => {
      // Defer setting to Idle to allow upstream value to settle.
      editModeRef.current = 'Idle';
    }, 0);
  };

  return (
    <TextField
      id={id}
      placeholder={placeholder}
      aria-label={placeholder}
      autoFocus
      helperText={helperText}
      error={isError}
      value={fieldValue}
      onChange={(event) => {
        editModeRef.current = 'Editing';
        const newValue = event.target.value;
        setFieldValue(newValue);
        if (isTruthy(updateUpstreamValueTimeoutIdRef.current)) {
          clearTimeout(updateUpstreamValueTimeoutIdRef.current);
        }
        updateUpstreamValueTimeoutIdRef.current = setTimeout(() => {
          updateUpstreamValue(newValue);
        }, 250);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          if (isTruthy(updateUpstreamValueTimeoutIdRef.current)) {
            clearTimeout(updateUpstreamValueTimeoutIdRef.current);
            updateUpstreamValueTimeoutIdRef.current = undefined;
          }
          updateUpstreamValue(fieldValue);
        }
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <MagnifyingGlassIcon size={16} color={colors.extended.gray['45']} />
            </InputAdornment>
          ),
          sx: {
            width,
            height: FILTER_HEIGHT,
            borderRadius: 4,
          },
        },
        htmlInput: {
          style: { paddingLeft: 0, paddingRight: '12px', fontSize: '14px' },
        },
      }}
    />
  );
}
