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
    // Base Colors
    background: string;
    card: string;
    text: string;
    subText: string;
    border: string;

    // Theme Specific Colors from globals.css
    primary: string; // --theme-500: Main interactive color
    primaryDark: string; // --theme-900 / --primary-color: Deep shading
    primaryLight: string; // --theme-300: Lighter shade for highlights

    // Gradient Components
    accentFrom: string; // --accent-from
    accentVia: string; // --accent-via
    accentTo: string; // --accent-to

    // UI Specifics
    activeTab: string; // --active-tab-color
    glow: string; // --glow-color (HEX representation)

    // Helper Gradients
    gradient: [string, string]; // Background gradient (primaryDark -> black)
    accentGradient: [string, string, string]; // Full accent gradient
  };
}

export const THEMES: Record<ThemeType, ThemeDefinition> = {
  violet: {
    name: "violet",
    label: "Violet",
    colors: {
      background: "#000000",
      card: "#181818",
      text: "#FFFFFF",
      subText: "#A7A7A7",
      border: "#333333",

      primary: "#8b5cf6",
      primaryDark: "#4c1d95",
      primaryLight: "#c4b5fd",

      accentFrom: "#7c3aed",
      accentVia: "#3b82f6",
      accentTo: "#ec4899",

      activeTab: "#4c1d95",
      glow: "#8b5cf6",

      gradient: ["#4c1d95", "#000000"],
      accentGradient: ["#7c3aed", "#3b82f6", "#ec4899"],
    },
  },
  emerald: {
    name: "emerald",
    label: "Emerald",
    colors: {
      background: "#000000",
      card: "#181818",
      text: "#FFFFFF",
      subText: "#A7A7A7",
      border: "#333333",

      primary: "#10b981",
      primaryDark: "#064e3b",
      primaryLight: "#6ee7b7",

      accentFrom: "#10b981",
      accentVia: "#06b6d4",
      accentTo: "#3b82f6",

      activeTab: "#064e3b",
      glow: "#10b981",

      gradient: ["#064e3b", "#000000"],
      accentGradient: ["#10b981", "#06b6d4", "#3b82f6"],
    },
  },
  rose: {
    name: "rose",
    label: "Rose",
    colors: {
      background: "#000000",
      card: "#181818",
      text: "#FFFFFF",
      subText: "#A7A7A7",
      border: "#333333",

      primary: "#f43f5e",
      primaryDark: "#881337",
      primaryLight: "#fda4af",

      accentFrom: "#f43f5e",
      accentVia: "#ec4899",
      accentTo: "#a855f7",

      activeTab: "#881337",
      glow: "#f43f5e",

      gradient: ["#881337", "#000000"],
      accentGradient: ["#f43f5e", "#ec4899", "#a855f7"],
    },
  },
  amber: {
    name: "amber",
    label: "Amber",
    colors: {
      background: "#000000",
      card: "#181818",
      text: "#FFFFFF",
      subText: "#A7A7A7",
      border: "#333333",

      primary: "#f59e0b",
      primaryDark: "#78350f",
      primaryLight: "#fcd34d",

      accentFrom: "#f59e0b",
      accentVia: "#ef4444",
      accentTo: "#ec4899",

      activeTab: "#78350f",
      glow: "#f59e0b",

      gradient: ["#78350f", "#000000"],
      accentGradient: ["#f59e0b", "#ef4444", "#ec4899"],
    },
  },
  sky: {
    name: "sky",
    label: "Sky",
    colors: {
      background: "#000000",
      card: "#181818",
      text: "#FFFFFF",
      subText: "#A7A7A7",
      border: "#333333",

      primary: "#0ea5e9",
      primaryDark: "#0c4a6e",
      primaryLight: "#7dd3fc",

      accentFrom: "#0ea5e9",
      accentVia: "#6366f1",
      accentTo: "#8b5cf6",

      activeTab: "#0c4a6e",
      glow: "#0ea5e9",

      gradient: ["#0c4a6e", "#000000"],
      accentGradient: ["#0ea5e9", "#6366f1", "#8b5cf6"],
    },
  },
};
