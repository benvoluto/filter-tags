// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ b7a79db66e71
// Source:     web/staff/src/components/FiltersV2/components/ChipAndPopover.tsx
// URL:        https://github.com/VivaaHealth/vivaa/blob/b7a79db66e71b49695854bee6ca7216f40d25fa3/web/staff/src/components/FiltersV2/components/ChipAndPopover.tsx
// Ref:        main (upstream commit 2026-08-03)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import { Box, Chip, Popover, chipClasses, popoverClasses } from '@mui/material';
import { PlusIcon, XIcon } from '@phosphor-icons/react';
import { type ReactNode, useId, useRef } from 'react';

import { colors, isDefined } from 'common';

interface Props {
  fieldLabel: ReactNode;
  selectedValue: ReactNode | undefined;
  children: ReactNode;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onDelete: (() => void) | undefined;
  isLoading?: boolean;
}

export function FilterChipAndPopover(props: Props) {
  const { children, fieldLabel, selectedValue, isOpen, setIsOpen, onDelete } = props;
  const anchorElementRef = useRef<HTMLDivElement | null>(null);
  const popoverId = useId();

  return (
    <>
      <Chip
        icon={isDefined(selectedValue) ? undefined : <PlusIcon size={16} />}
        label={
          <>
            {fieldLabel}
            {isDefined(selectedValue) && (
              <Box
                component="span"
                sx={{
                  marginLeft: '8px',
                  backgroundColor: '#e5efff',
                  paddingX: '4px',
                  paddingY: '2px',
                  borderRadius: '2px',
                }}
              >
                {selectedValue}
              </Box>
            )}
          </>
        }
        variant="outlined"
        color="default"
        ref={anchorElementRef}
        onClick={() => {
          setIsOpen(true);
        }}
        aria-describedby={popoverId}
        onDelete={onDelete}
        deleteIcon={<XIcon />}
        sx={{
          backgroundColor: 'background.paper',
          fontWeight: 'bold',
          borderWidth: 1,
          borderStyle: isDefined(selectedValue) ? 'solid' : 'dashed',
          [`& .${chipClasses.icon}`]: {
            marginLeft: '8px',
          },
          [`& .${chipClasses.deleteIcon}`]: {
            color: colors.extended.gray['45'],
            fontSize: '16px',
            '&:hover': {
              color: '#3f3f3f',
            },
          },
          [`&.${chipClasses.focusVisible}`]: {
            backgroundColor: 'background.paper',
            borderColor: 'black',
          },
        }}
      />
      <Popover
        id={popoverId}
        open={isOpen}
        // eslint-disable-next-line react-hooks/refs
        anchorEl={anchorElementRef.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        onClose={() => {
          setIsOpen(false);
        }}
        sx={{
          [`& .${popoverClasses.paper}`]: {
            marginTop: '4px',
            border: '1px solid #d9d9d9',
            boxShadow: '0px 16px 40px 0px rgba(37, 39, 82, 0.14)',
          },
        }}
      >
        <Box padding="16px">{children}</Box>
      </Popover>
    </>
  );
}
