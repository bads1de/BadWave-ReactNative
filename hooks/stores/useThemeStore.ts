import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { ThemeType, THEMES, ThemeDefinition } from "@/constants/ThemeColors";
import { mmkvSyncAdapter } from "@/lib/storage/mmkv-sync-adapter";

interface ThemeState {
  currentTheme: ThemeType;
  colors: ThemeDefinition["colors"];
  setTheme: (theme: ThemeType) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      currentTheme: "violet",
      colors: THEMES.violet.colors,
      setTheme: (theme) =>
        set({
          currentTheme: theme,
          colors: THEMES[theme].colors,
        }),
    }),
    {
      name: "theme-storage",
      storage: createJSONStorage(() => mmkvSyncAdapter),
      partialize: (state) => ({ currentTheme: state.currentTheme }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validate stored theme, fallback to default if invalid (e.g. removed 'monochrome')
          if (!THEMES[state.currentTheme]) {
            state.currentTheme = "violet";
          }
          state.colors = THEMES[state.currentTheme].colors;
        }
      },
    }
  )
);
