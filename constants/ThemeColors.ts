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

    // Error and Success
    error: string;
    success: string;

    // Helper Gradients
    gradient: [string, string];
    accentGradient: [string, string, string];
  };
}

const LUXURY_BASE_COLORS = {
  background: "#0A0A0A",
  card: "#171717",
  text: "#F5F5F5",
  subText: "#A8A29E",
  border: "#262626",
  error: "#991B1B",
  success: "#166534",
};

export const THEMES: Record<ThemeType, ThemeDefinition> = {
  violet: {
    // Midnight Gold
    name: "violet",
    label: "Midnight",
    colors: {
      ...LUXURY_BASE_COLORS,
      primary: "#D4AF37", // Gold
      primaryDark: "#1C1917",
      primaryLight: "#FDE68A",
      accentFrom: "#D4AF37",
      accentVia: "#A8A29E",
      accentTo: "#F5F5F5",
      activeTab: "#D4AF37",
      glow: "rgba(212, 175, 55, 0.3)",
      gradient: ["#1C1917", "#0A0A0A"],
      accentGradient: ["#D4AF37", "#A8A29E", "#F5F5F5"],
    },
  },
  emerald: {
    // Deep Forest
    name: "emerald",
    label: "Forest",
    colors: {
      ...LUXURY_BASE_COLORS,
      primary: "#064E3B",
      primaryDark: "#022C22",
      primaryLight: "#10B981",
      accentFrom: "#064E3B",
      accentVia: "#065F46",
      accentTo: "#059669",
      activeTab: "#10B981",
      glow: "rgba(16, 185, 129, 0.2)",
      gradient: ["#022C22", "#0A0A0A"],
      accentGradient: ["#064E3B", "#065F46", "#059669"],
    },
  },
  rose: {
    // Velvet Wine
    name: "rose",
    label: "Velvet",
    colors: {
      ...LUXURY_BASE_COLORS,
      primary: "#450A0A",
      primaryDark: "#2D0606",
      primaryLight: "#991B1B",
      accentFrom: "#450A0A",
      accentVia: "#7F1D1D",
      accentTo: "#B91C1C",
      activeTab: "#B91C1C",
      glow: "rgba(185, 28, 28, 0.2)",
      gradient: ["#2D0606", "#0A0A0A"],
      accentGradient: ["#450A0A", "#7F1D1D", "#B91C1C"],
    },
  },
  amber: {
    // Royal Sand
    name: "amber",
    label: "Sand",
    colors: {
      ...LUXURY_BASE_COLORS,
      primary: "#78350F",
      primaryDark: "#451A03",
      primaryLight: "#D97706",
      accentFrom: "#78350F",
      accentVia: "#B45309",
      accentTo: "#F59E0B",
      activeTab: "#F59E0B",
      glow: "rgba(245, 158, 11, 0.2)",
      gradient: ["#451A03", "#0A0A0A"],
      accentGradient: ["#78350F", "#B45309", "#F59E0B"],
    },
  },
  sky: {
    // Arctic Slate
    name: "sky",
    label: "Slate",
    colors: {
      ...LUXURY_BASE_COLORS,
      primary: "#0F172A",
      primaryDark: "#020617",
      primaryLight: "#334155",
      accentFrom: "#0F172A",
      accentVia: "#1E293B",
      accentTo: "#475569",
      activeTab: "#94A3B8",
      glow: "rgba(148, 163, 184, 0.2)",
      gradient: ["#020617", "#0A0A0A"],
      accentGradient: ["#0F172A", "#1E293B", "#475569"],
    },
  },
};
