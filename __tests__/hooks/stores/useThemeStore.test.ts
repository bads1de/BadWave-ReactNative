import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { THEMES } from "@/constants/ThemeColors";
import { act } from "@testing-library/react-native";

// MMKV のモックは jest.setup.js で行われている前提（またはここで行う）
// 手動でモック
jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn(() => ({
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe("useThemeStore", () => {
  beforeEach(() => {
    // ストアを初期化
    act(() => {
      useThemeStore.getState().setTheme("violet");
    });
  });

  it("初期テーマは violet である", () => {
    const state = useThemeStore.getState();
    expect(state.currentTheme).toBe("violet");
    expect(state.colors).toEqual(THEMES.violet.colors);
  });

  it("setTheme でテーマを変更できる", async () => {
    await act(async () => {
      useThemeStore.getState().setTheme("emerald");
    });

    const state = useThemeStore.getState();
    expect(state.currentTheme).toBe("emerald");
    expect(state.colors).toEqual(THEMES.emerald.colors);
  });
});
