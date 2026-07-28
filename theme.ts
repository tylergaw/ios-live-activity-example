// Lightweight design tokens.
//
// Colors are split into light/dark palettes; everything scheme-invariant
// (space, radius, font) is shared. Consume the palette via `useColorScheme()`
// in a component (see App.tsx) — per the RN docs the active scheme can change
// at runtime, so it must be read on render, not cached at module load.
//
// Names are role-based (`danger`, not `red500`) so a value can be retuned in
// one place. `as const` keeps values as literals, which satisfies React
// Native's `fontWeight` / `fontVariant` types.

export const palettes = {
  light: {
    bg: "#fff",
    text: "#000",
    textMuted: "#999",
    border: "rgba(0, 0, 0, 0.25)",
    accent: "#000",
    button: {
      default: { bg: "rgba(0, 0, 0, 0.2)", text: "#000" },
      pause: { bg: "rgba(245, 158, 11, 0.25)", text: "#F59E0B" },
      resume: { bg: "rgba(16, 185, 129, 0.25)", text: "#10B981" },
    },
  },
  dark: {
    bg: "#000",
    text: "#fff",
    textMuted: "#666",
    border: "rgba(255, 255, 255, 0.25)",
    accent: "#fff",
    button: {
      default: { bg: "rgba(255, 255, 255, 0.3)", text: "#fff" },
      pause: { bg: "rgba(245, 158, 11, 0.25)", text: "#F59E0B" },
      resume: { bg: "rgba(16, 185, 129, 0.25)", text: "#10B981" },
    },
  },
} as const;

export type ColorScheme = keyof typeof palettes;
export type Palette = (typeof palettes)[ColorScheme];

export const space = {
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  md: 12,
  pill: 40,
} as const;

export const font = {
  size: {
    sm: 16,
    md: 18,
    xl: 48,
    timer: 80,
  },
  weight: {
    light: "300",
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
} as const;
