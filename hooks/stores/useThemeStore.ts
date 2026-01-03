import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { MMKV } from "react-native-mmkv";
import { ThemeType, THEMES, ThemeDefinition } from "@/constants/ThemeColors";

const storage = new MMKV();

const mmkvStorage = {
  getItem: (name: string) => storage.getString(name) ?? null,
  setItem: (name: string, value: string) => storage.set(name, value),
  removeItem: (name: string) => storage.delete(name),
};

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
      storage: createJSONStorage(() => mmkvStorage),
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
