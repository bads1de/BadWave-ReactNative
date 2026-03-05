/**
 * @file constants/ThemeColors.ts
 * @description アプリケーションのカラーテーマ定義
 *
 * デスクトップ版 (badwave/app/globals.css) の定義と一致させています。
 * button, active-tab, glow などの詳細な値を管理します。
 */

export type ThemeType = "violet" | "emerald" | "rose" | "amber" | "sky";

export interface ThemeDefinition {
  name: ThemeType;
  label: string;
  colors: {
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;

    primary: string;
    primaryDark: string;
    primaryLight: string;

    accentFrom: string;
    accentVia: string;
    accentTo: string;

    activeTab: string;
    glow: string;

    error: string;
    success: string;

    gradient: [string, string];
    accentGradient: [string, string, string];
  };
}

const BASE_COLORS = {
  background: "#000000",
  card: "#18181b", // zinc-900
  text: "#ffffff",
  subText: "#a1a1aa", // zinc-400
  border: "#27272a", // zinc-800
  error: "#ef4444",
  success: "#22c55e",
};

export const THEMES: Record<ThemeType, ThemeDefinition> = {
  violet: {
    name: "violet",
    label: "Violet",
    colors: {
      ...BASE_COLORS,
      primary: "#4c1d95", // --primary-color
      primaryDark: "#581c87", // --theme-900
      primaryLight: "#8b5cf6", // --theme-500
      accentFrom: "#7c3aed", // --accent-from
      accentVia: "#3b82f6", // --accent-via
      accentTo: "#ec4899", // --accent-to
      activeTab: "#4c1d95", // --active-tab-color
      glow: "rgba(139, 92, 246, 0.4)", // --glow-color
      gradient: ["#4c1d95", "#000000"],
      accentGradient: ["#7c3aed", "#3b82f6", "#ec4899"],
    },
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    colors: {
      ...BASE_COLORS,
      primary: "#064e3b",
      primaryDark: "#064e3b",
      primaryLight: "#10b981",
      accentFrom: "#10b981",
      accentVia: "#06b6d4",
      accentTo: "#3b82f6",
      activeTab: "#064e3b",
      glow: "rgba(16, 185, 129, 0.4)",
      gradient: ["#064e3b", "#000000"],
      accentGradient: ["#10b981", "#06b6d4", "#3b82f6"],
    },
  },
  rose: {
    name: "rose",
    label: "Rose",
    colors: {
      ...BASE_COLORS,
      primary: "#881337",
      primaryDark: "#881337",
      primaryLight: "#f43f5e",
      accentFrom: "#f43f5e",
      accentVia: "#ec4899",
      accentTo: "#a855f7",
      activeTab: "#881337",
      glow: "rgba(244, 63, 94, 0.4)",
      gradient: ["#881337", "#000000"],
      accentGradient: ["#f43f5e", "#ec4899", "#a855f7"],
    },
  },
  amber: {
    name: "amber",
    label: "Amber",
    colors: {
      ...BASE_COLORS,
      primary: "#78350f",
      primaryDark: "#78350f",
      primaryLight: "#f59e0b",
      accentFrom: "#f59e0b",
      accentVia: "#ef4444",
      accentTo: "#ec4899",
      activeTab: "#78350f",
      glow: "rgba(245, 158, 11, 0.4)",
      gradient: ["#78350f", "#000000"],
      accentGradient: ["#f59e0b", "#ef4444", "#ec4899"],
    },
  },
  sky: {
    name: "sky",
    label: "Sky",
    colors: {
      ...BASE_COLORS,
      primary: "#0c4a6e",
      primaryDark: "#0c4a6e",
      primaryLight: "#0ea5e9",
      accentFrom: "#0ea5e9",
      accentVia: "#6366f1",
      accentTo: "#8b5cf6",
      activeTab: "#0c4a6e",
      glow: "rgba(14, 165, 233, 0.4)",
      gradient: ["#0c4a6e", "#000000"],
      accentGradient: ["#0ea5e9", "#6366f1", "#8b5cf6"],
    },
  },
};
