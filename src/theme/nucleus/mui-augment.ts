// ───────────────────────────────────────────────────────────────────────────
// Provenance: VivaaHealth/vivaa @ 64eea0d020a8
// Source:     web/common/src/styled.ts
// URL:        https://github.com/VivaaHealth/vivaa/blob/64eea0d020a89f99cc6d6529d9e136a228e341f4/web/common/src/styled.ts
// Ref:        main (upstream commit 2026-07-17)
// Fetched:    2026-09-01  (via scripts/sync-from-monorepo.mjs)
// Note:       MUI module augmentations - theme.colors, theme.boxShadows, the extra zIndex layers, and the monospace typography variant. Emits no runtime code; mui-theme.ts side-effect imports it so the declarations load.
// DO NOT EDIT — run `pnpm sync:monorepo` to refresh.
// ───────────────────────────────────────────────────────────────────────────

/**
 * MUI theme module augmentations for common's custom theme. Emits no runtime
 * code; it is side-effect imported from the package entry so the augmentations
 * load into any consumer that compiles common from source.
 *
 * Everything here is additive and optional so that pulling it into a consumer's
 * program cannot break existing `createTheme` calls or built-in theme members
 * (e.g. `theme.zIndex.drawer`).
 */
export {};

interface BrandColor {
  default: string;
  dark: string;
  darker: string;
}

interface StatusColor {
  default: string;
  dark: string;
  light: string;
}

interface Colors {
  common: {
    black: string;
    white: string;
  };
  extended: {
    blue: {
      95: string;
      90: string;
      80: string;
      70: string;
      60: string;
      primary: string;
      40: string;
      30: string;
      20: string;
      10: string;
    };
    green: {
      95: string;
      90: string;
      80: string;
      70: string;
      60: string;
      55: string;
      40: string;
      30: string;
      20: string;
      10: string;
    };
    gray: {
      97: string;
      93: string;
      85: string;
      75: string;
      65: string;
      55: string;
      45: string;
      35: string;
      25: string;
    };
    red: {
      95: string;
      90: string;
      85: string;
      80: string;
      70: string;
      60: string;
      50: string;
      40: string;
      30: string;
      25: string;
    };
    yellow: {
      95: string;
      90: string;
      80: string;
      70: string;
      60: string;
      50: string;
      45: string;
      35: string;
      25: string;
      15: string;
    };
  };
  background: {
    default: string;
    dark: string;
    disabled: string;
    knockout: string;
    brand: string;
  };
  content: {
    default: string;
    dark: string;
    disabled: string;
    knockout: string;
  };
  border: {
    default: string;
    light: string;
    dark: string;
    focus: string;
  };
  primary: BrandColor;
  secondary: BrandColor;
  danger: StatusColor;
  success: StatusColor;
  warning: StatusColor;
}

interface BoxShadow {
  stroke: string;
  small: string;
  medium: string;
  large: string;
}

declare module '@mui/material/styles' {
  interface Theme {
    boxShadows: BoxShadow;
    colors: Colors;
  }

  interface ThemeOptions {
    boxShadows?: Partial<BoxShadow>;
    colors?: Partial<Colors>;
  }

  // Extend MUI's built-in z-index set with custom layers; modal already exists.
  interface ZIndex {
    navBar: number;
    toast: number;
  }
  interface TypographyVariants {
    monospace: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    monospace?: React.CSSProperties;
  }

  // MuiDataGrid component configuration
  interface Components {
    MuiDataGrid?: {
      styleOverrides?: {
        cell?: React.CSSProperties;
        root?: React.CSSProperties;
        [key: string]: React.CSSProperties | undefined;
      };
    };
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    monospace: true;
  }
}
