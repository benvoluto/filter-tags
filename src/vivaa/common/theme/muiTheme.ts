// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 6c22e961bf73
// Source:     web/common/src/theme/muiTheme.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/6c22e961bf7382e054026b82558371e8b7387c31/web/common/src/theme/muiTheme.ts
// Ref:        main (upstream commit 2026-09-30)
// Fetched:    2026-10-19  (via scripts/sync-from-vivaa.mjs)
// Rewrites:   '@mui/x-data-grid-pro' → '@mui/x-data-grid'
// Note:       The staff app's theme. One rewrite: gridClasses comes from the MIT @mui/x-data-grid (identical class names) because this public repo carries no MUI X Pro licence.
// DO NOT EDIT — run `pnpm sync:vivaa` to refresh.
// ───────────────────────────────────────────────────────────────────────────

import {
  accordionClasses,
  accordionSummaryClasses,
  alpha,
  autocompleteClasses,
  buttonClasses,
  checkboxClasses,
  chipClasses,
  createTheme,
  formControlLabelClasses,
  formGroupClasses,
  formLabelClasses,
  linkClasses,
  outlinedInputClasses,
  paperClasses,
  radioClasses,
  radioGroupClasses,
  tabClasses,
  tableCellClasses,
  tabsClasses,
  toggleButtonClasses,
} from '@mui/material';
import type {} from '@mui/x-chat/themeAugmentation';
import { gridClasses } from '@mui/x-data-grid';

import { boxShadows } from './boxShadows/index.js';
import { breakpoints } from './breakpoints/index.js';
import { paletteColors } from './colors/colors.js';
import { gray } from './colors/gray.js';
import { colors } from './colors/index.js';
import { typography } from './typography/typography.js';
import { zIndex } from './zIndex/index.js';

const LINK_COLOR = colors.extended.gray[25];
const LINK_COLOR_HOVER = colors.extended.blue[5];

const focusBoxShadow = `0 0 0 4px ${gray[93]}`;
export const muiTheme = createTheme({
  boxShadows,
  breakpoints: {
    values: breakpoints.values,
  },
  typography,
  colors,
  palette: paletteColors,
  zIndex,
  components: {
    MuiAccordion: {
      defaultProps: {
        variant: 'outlined',
        disableGutters: true,
        square: true,
      },
      styleOverrides: {
        root: {
          '&::before': {
            display: 'none',
          },
          [`&.${accordionClasses.gutters}`]: {
            border: 'none',
            //Divider between accordions
          },
          [`&.${paperClasses.root}`]: {
            border: 'none',
          },
          [`& .MuiAccordion-heading`]: {
            display: 'flex',
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0 24px',
          backgroundColor: colors.background.default,
          borderRadius: 'inherit',
          borderBottom: '1px solid',
          borderColor: colors.border.light,
          boxSizing: 'content-box',
          height: '48px',
          alignItems: 'center',
          // Distance between summary content and expand/collapse icon
          gap: '8px',
          '&:hover, &:focus-visible': {
            backgroundColor: colors.background.disabled,
          },
          [`&.${accordionSummaryClasses.expanded}`]: {
            height: '48px',
          },
          [`& .${accordionSummaryClasses.content}`]: {
            margin: '0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '24px',
          borderBottom: '1px solid',
          borderColor: colors.border.light,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0,0,0,0.35)',
        },
        invisible: {
          backgroundColor: 'transparent',
        },
      },
    },
    MuiBreadcrumbs: {
      defaultProps: {
        separator: '>',
      },
      styleOverrides: {
        root: {
          '& a': {
            color: colors.extended.gray[45],
            textDecoration: 'none',
            transition: 'color 0.3s ease',
            '&:hover, &:focus, &:active': {
              color: colors.extended.gray[25],
            },
          },

          '& div': {
            color: colors.content.default,
            cursor: 'default',
            fontWeight: 600,
          },

          '& span': {
            color: colors.extended.blue[5],
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          [`&.${buttonClasses.focusVisible}`]: {
            boxShadow: focusBoxShadow,
          },
          fontSize: '0.875rem',
        },
        sizeSmall: {
          padding: '2px 8px',
          [`&.${buttonClasses.outlined}`]: {
            padding: '1px 7px',
          },
        },
        sizeMedium: {
          padding: '6px 12px',
          [`&.${buttonClasses.outlined}`]: {
            padding: '5px 11px',
          },
        },
        sizeLarge: {
          padding: '10px 12px',
          [`&.${buttonClasses.outlined}`]: {
            padding: '9px 11px',
          },
        },
      },
    },
    MuiButtonGroup: {
      styleOverrides: {
        grouped: {
          minWidth: 32,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiCardHeader: {
      styleOverrides: {
        root: {
          paddingBottom: '0px',
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '&:last-child': {
            paddingBottom: '16px',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          padding: '0 4px',
          [`&.${chipClasses.focusVisible}`]: {
            boxShadow: focusBoxShadow,
          },
        },
        labelMedium: {
          padding: '12px',
        },
      },
    },
    /**
     * Dialog
     */
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: gray[25],
          fontSize: '1rem',
          fontWeight: 600,
          marginY: '12px',
        },
      },
    },
    MuiDialogContent: {
      defaultProps: {
        dividers: true,
      },
      styleOverrides: {
        root: {
          borderBottom: 'unset',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: '16px 24px',
          paddingTop: '8px',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: gray[75],
          /**
           * Bootstrap global styles sets styles for hr elements.
           * This is a temporary workaround. When we remove bootstrap we can remove this override.
           */
          opacity: 1,
        },
      },
    },
    /**
     * Form Fields
     */
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 0,
        },
      },
    },
    MuiAutocomplete: {
      defaultProps: {
        /**
         * Do not set `filterSelectedOptions` to true. It makes the UI damned
         * confusing when the dropdown doesn't show the selected option that you have chosen.
         * Keep the defaults which is  false.
         */
        filterSelectedOptions: false,
        autoHighlight: true,
      },
      styleOverrides: {
        inputRoot: {
          padding: '0 9px',
          [`& input.${autocompleteClasses.input}`]: {
            height: '1.5625em',
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          '& input': {
            padding: '6.5px 14px',
            height: '1.6875em',
          },
        },
        sizeSmall: {
          fontSize: '0.875rem',
          '& input': {
            // This counteracts the fontSize to result in a 32px height padded input
            padding: '6.5px 14px',
            height: '1.3571428571428572em',
          },
        },
        input: {
          '&::placeholder': {
            opacity: 1,
            color: gray[45],
          },
        },
        multiline: {
          padding: '8.5px 14px !important',
        },
        inputMultiline: {
          resize: 'vertical',
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          padding: '6.5px 4px',
        },
        select: {
          padding: '2px 14px',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            [`& .${outlinedInputClasses.notchedOutline}`]: {
              borderColor: 'black',
              borderWidth: '1px',
              boxShadow: focusBoxShadow,
            },
          },
        },
      },
    },
    /**
     * Form labels
     */
    MuiInputLabel: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 600,
          transform: 'unset',
          translate: 'unset',
        },
        sizeSmall: {
          fontSize: '0.875rem',
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          fontWeight: 600,
          transform: 'unset',
          translate: 'unset',
          [`&.${formLabelClasses.focused}`]: {
            color: gray[25],
          },
        },
      },
    },
    /**
     * End of Form Fields
     */
    MuiLink: {
      styleOverrides: {
        root: ({ ownerState }) => ({
          ...(ownerState.color === 'primary' && {
            color: LINK_COLOR,
            '--Link-underlineColor': LINK_COLOR_HOVER,
            '&:hover': {
              color: LINK_COLOR_HOVER,
            },
          }),
        }),
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderBottom: '1px solid',
          borderColor: colors.border.light,
          [`& .${tabsClasses.flexContainer}`]: {
            gap: '16px',
          },
        },
        vertical: {
          minHeight: 'unset',
          borderBottom: 'unset',
          borderLeft: '1px solid',
          borderColor: colors.border.light,
          [`& .${tabClasses.root}`]: {
            textAlign: 'left',
            alignItems: 'flex-start',
          },
          [`& .${tabsClasses.flexContainer}`]: {
            gap: 'unset',
          },
          [`& .${tabsClasses.indicator}`]: {
            left: 0,
            width: 4,
            borderRadius: '0 4px 4px 0',
          },
        },
        indicator: {
          height: 4,
          backgroundColor: colors.extended.blue[40],
          borderRadius: '4px 4px 0 0',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          padding: 0,
          minWidth: 0,
          minHeight: 48,
          [`.${tabsClasses.vertical} &`]: {
            padding: '8px',
            paddingLeft: '16px',
            minWidth: 64,
            minHeight: 32,
          },
          color: colors.content.dark,
          [`&.${tabClasses.selected}`]: {
            color: colors.extended.blue[40],
          },
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          boxShadow: 'unset',
          border: '1px solid',
          borderColor: colors.border.default,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        selectLabel: {
          /**
           * Bootstrap global styles set margin for p elements.
           * This is a temporary workaround to remove the margin. When we remove bootstrap we can remove this override.
           */
          margin: 'unset',
        },
        displayedRows: {
          /**
           * Bootstrap global styles set margin for p elements.
           * This is a temporary workaround to remove the margin. When we remove bootstrap we can remove this override.
           */
          margin: 'unset',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          [`& .${tableCellClasses.root}`]: {
            backgroundColor: colors.background.default,
            ...typography.h6,
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          [`& .${linkClasses.root}`]: {
            color: LINK_COLOR,
            '--Link-underlineColor': LINK_COLOR_HOVER,
            '&:hover': {
              color: LINK_COLOR_HOVER,
            },
          },
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        columnHeader: {
          backgroundColor: colors.background.default,
          [`& .${gridClasses.sortButton}`]: {
            color: colors.content.default,
          },
          [`&:not(.${gridClasses['columnHeader--sorted']}):hover .${gridClasses.sortButton}`]: {
            color: colors.content.dark,
          },
        },
        cell: {
          [`& .${linkClasses.root}`]: {
            color: LINK_COLOR,
            '&:hover': {
              color: LINK_COLOR_HOVER,
            },
          },
        },
      },
    },
    MuiAlertTitle: {
      styleOverrides: {
        root: {
          color: 'unset',
          fontWeight: 'bold',
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          // When any small radio exists, reduce FormLabel fontSize
          [`& .${formLabelClasses.root}:has(~ .${radioGroupClasses.root} .${radioClasses.root}.${radioClasses.sizeSmall})`]:
            {
              fontSize: '0.875rem',
            },
          // When any small checkbox exists, reduce FormLabel fontSize
          [`& .${formLabelClasses.root}:has(~ .${formGroupClasses.root} .${checkboxClasses.root}.${checkboxClasses.sizeSmall})`]:
            {
              fontSize: '0.875rem',
            },
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          [`&:hover:not(.${formControlLabelClasses.disabled})`]: {
            [`& .${formControlLabelClasses.label}`]: {
              color: colors.extended.blue[5],
            },
          },
          [`& .${radioClasses.root}.${radioClasses.sizeSmall} + .${formControlLabelClasses.label}`]:
            {
              fontSize: '0.875rem',
            },
          [`& .${checkboxClasses.root}.${checkboxClasses.sizeSmall} + .${formControlLabelClasses.label}`]:
            {
              fontSize: '0.875rem',
            },
          [`&:has(.${radioClasses.root})`]: {
            marginLeft: '-7px',
          },
          [`&:has(.${checkboxClasses.root})`]: {
            marginLeft: '-7px',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          padding: '4px',
        },
        colorPrimary: {
          [`&.${radioClasses.checked}`]: {
            color: colors.extended.blue.primary,
          },
          [`&.${radioClasses.disabled}`]: {
            color: colors.extended.gray[75],
          },
          [`&:hover:not(.${radioClasses.disabled}):not(.${radioClasses.checked})`]: {
            color: colors.extended.blue[5],
          },
          [`&:has(~ .${formControlLabelClasses.label}:hover):not(.${radioClasses.checked}):not(.${radioClasses.disabled})`]:
            {
              color: colors.extended.blue[5],
            },
        },
      },
    },
    MuiChatMessageList: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.colors.background.knockout,
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: theme.spacing(5),
            background: `linear-gradient(to bottom, ${alpha(theme.colors.background.knockout, 0)}, ${theme.colors.background.knockout})`,
            pointerEvents: 'none',
            zIndex: 1,
          },
        }),
        content: ({ theme }) => ({
          marginInline: 'auto',
          maxWidth: theme.breakpoints.values.lg,
          paddingInline: theme.spacing(3),
          paddingTop: theme.spacing(10),
          paddingBottom: theme.spacing(5),
          width: '100%',
        }),
      },
    },
    MuiChatStreamingIndicator: {
      styleOverrides: {
        row: {
          paddingInline: 0,
          marginBlockStart: 0,
          gridTemplateColumns: 'minmax(0, 1fr)',
          gridTemplateAreas: '"content"',
        },
      },
    },
    MuiChatMessage: {
      styleOverrides: {
        group: ({ theme }) => ({ paddingBottom: theme.spacing(5) }),
        root: {
          paddingInline: 0,
          paddingBottom: 0,
        },
        bubble: ({ theme, ownerState }) => ({
          ...theme.typography.body1,
          ...(ownerState?.role === 'assistant' && {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            minWidth: 0,
            gap: theme.spacing(1.5),
            // Start at Markdown roots so tool disclosures keep their own styles.
            '& > :is(p, h1, h2, h3, h4, h5, h6, ul, ol, blockquote, table, hr, pre, footer)': {
              fontSize: '15px',
              lineHeight: 1.6,
              overflowWrap: 'anywhere',
              wordBreak: 'normal',
              margin: 0,
              '&:is(h1, h2, h3, h4, h5, h6), & :is(h1, h2, h3, h4, h5, h6)': {
                color: 'inherit',
                fontFamily: 'inherit',
                fontWeight: 600,
                lineHeight: 1.4,
                letterSpacing: '-0.07px',
                margin: 0,
              },
              '&:is(h1), & h1': { fontSize: '22px' },
              '&:is(h2), & h2': { fontSize: '20px' },
              '&:is(h3), & h3': { fontSize: '18px' },
              '&:is(h4, h5, h6), & :is(h4, h5, h6)': { fontSize: '15px' },
              '& + :is(h1, h2, h3, h4, h5, h6)': { marginTop: theme.spacing(1.5) },
              '& :is(p, ul, ol, blockquote, table, hr)': { margin: 0 },
              '& :is(h1, h2, h3, h4, h5, h6) + *': { marginTop: theme.spacing(1) },
              '& :is(p, ul, ol, blockquote, table, pre) + *': { marginTop: theme.spacing(1) },
              '&:is(ul, ol), & :is(ul, ol)': {
                paddingLeft: theme.spacing(3),
                '& li + li': { marginTop: theme.spacing(0.5) },
                '& li > :is(ul, ol)': { marginTop: theme.spacing(0.5) },
                '& input[type="checkbox"]': { marginRight: theme.spacing(1) },
                '& li:has(> input[type="checkbox"])': {
                  listStyle: 'none',
                  '& > input + p': { display: 'inline' },
                },
              },
              '& strong': { fontWeight: 600 },
              '& a': {
                color: theme.palette.primary.main,
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              },
              '& code:not(pre > code)': {
                color: 'inherit',
                backgroundColor: theme.colors.background.default,
                fontSize: '0.9em',
                padding: '2px 4px',
                borderRadius: '3px',
                whiteSpace: 'break-spaces',
              },
              '& img': { maxWidth: '100%', height: 'auto' },
              '&:is(table), & table': {
                display: 'block',
                maxWidth: '100%',
                overflowX: 'auto',
                overflowWrap: 'normal',
                borderCollapse: 'collapse',
                fontSize: '14px',
                lineHeight: 1.5,
                '& > thead:not(:has(th:not(:empty)))': { display: 'none' },
                '& :is(th, td)': {
                  padding: theme.spacing(1, 1.5),
                  verticalAlign: 'top',
                  border: `1px solid ${theme.colors.border.light}`,
                },
                '& th': {
                  textAlign: 'start',
                  fontWeight: 600,
                  backgroundColor: theme.colors.background.default,
                },
              },
              '&:is(blockquote), & blockquote': {
                paddingLeft: theme.spacing(1.5),
                borderLeft: `3px solid ${theme.colors.border.light}`,
                '& > * + *': { marginTop: theme.spacing(1) },
              },
              '&:is(hr), & hr': {
                width: '100%',
                border: 0,
                borderTop: `1px solid ${theme.colors.border.light}`,
                opacity: 1,
              },
            },
            '& > .MuiChatCodeBlock-root, & > :is(blockquote, ul, ol) .MuiChatCodeBlock-root': {
              minWidth: 0,
              maxWidth: '100%',
              margin: 0,
              border: `1px solid ${theme.colors.border.light}`,
              borderRadius: theme.shape.borderRadius,
              '& pre': {
                padding: theme.spacing(1.5),
                fontSize: '13px',
                lineHeight: 1.6,
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                wordBreak: 'normal',
              },
              '& code': { color: 'inherit', fontSize: 'inherit' },
            },
            '& > :is(blockquote, ul, ol) .MuiChatCodeBlock-root': {
              marginBlock: theme.spacing(1),
            },
          }),
          ...(ownerState?.role === 'user' && {
            alignSelf: 'flex-end',
            backgroundColor: theme.colors.background.default,
            borderRadius: theme.shape.borderRadius,
            padding: theme.spacing(1.5),
          }),
        }),
      },
    },
    MuiChatComposer: {
      styleOverrides: {
        root: ({ theme }) => ({
          alignSelf: 'center',
          backgroundColor: theme.colors.background.knockout,
          borderColor: theme.colors.border.default,
          borderRadius: theme.shape.borderRadius,
          marginBottom: theme.spacing(1.5),
          marginInline: theme.spacing(3),
          maxWidth: theme.breakpoints.values.lg,
          width: `calc(100% - ${theme.spacing(6)})`,
        }),
        textArea: ({ theme }) => ({
          ...theme.typography.body1,
          flex: 'none',
          minHeight: `calc(3lh + ${theme.spacing(1)})`,
          maxHeight: `calc(7lh + ${theme.spacing(1)})`,
        }),
        toolbar: { justifyContent: 'flex-end' },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: '4px',
        },
        colorPrimary: {
          [`&.${checkboxClasses.checked}`]: {
            color: colors.extended.blue.primary,
          },
          [`&.${checkboxClasses.disabled}`]: {
            color: colors.extended.gray[75],
          },
          [`&:hover:not(.${checkboxClasses.disabled}):not(.${checkboxClasses.checked}):not(.${checkboxClasses.indeterminate})`]:
            {
              color: colors.extended.blue[5],
            },
          [`&:has(~ .${formControlLabelClasses.label}:hover):not(.${checkboxClasses.checked}):not(.${checkboxClasses.disabled}):not(.${checkboxClasses.indeterminate})`]:
            {
              color: colors.extended.blue[5],
            },
        },
      },
    },
    MuiToggleButtonGroup: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: {
          overflow: 'hidden',
        },
        grouped: {
          borderRadius: 0,
          border: '1px solid',
          // FIXME: Update to use theme colors
          borderColor: colors.border.default,
          borderRight: 'none',
          '&:first-of-type': {
            borderTopLeftRadius: '4px',
            borderBottomLeftRadius: '4px',
          },
          '&:last-of-type': {
            borderRight: '1px solid',
            // FIXME: Update to use theme colors
            borderRightColor: colors.border.default,
            borderTopRightRadius: '4px',
            borderBottomRightRadius: '4px',
          },
        },
      },
    },
    MuiToggleButton: {
      defaultProps: {
        color: 'primary',
      },
      styleOverrides: {
        root: ({ ownerState }) => ({
          minWidth: 'auto',
          fontSize: '16px',
          fontWeight: 500,
          textTransform: 'none',
          '&.Mui-focusVisible': {
            boxShadow: focusBoxShadow,
          },
          ...(ownerState.color === 'primary' && {
            backgroundColor: paletteColors.primary?.contrastText,
            // FIXME: Update to use theme colors
            color: colors.content.default,
            '&:hover': {
              // FIXME: Update to use theme colors
              backgroundColor: colors.extended.gray[93],
            },
            [`&.${toggleButtonClasses.selected}`]: {
              // FIXME: Update to use theme colors
              backgroundColor: colors.extended.blue[95],
              // FIXME: Update to use theme colors
              color: colors.content.default,
              '&:hover': {
                // FIXME: Update to use theme colors
                backgroundColor: colors.extended.blue[90],
              },
            },
          }),
        }),
      },
    },
  },
});
