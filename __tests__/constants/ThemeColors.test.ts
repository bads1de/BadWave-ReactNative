import { THEMES, ThemeType, ThemeDefinition } from "@/constants/ThemeColors";

describe("ThemeColors", () => {
  describe("THEMES", () => {
    it("5つのテーマが定義されている", () => {
      expect(Object.keys(THEMES)).toHaveLength(5);
    });

    it("violetテーマが存在する", () => {
      expect(THEMES.violet).toBeDefined();
      expect(THEMES.violet.name).toBe("violet");
      expect(THEMES.violet.label).toBe("Violet");
    });

    it("emeraldテーマが存在する", () => {
      expect(THEMES.emerald).toBeDefined();
      expect(THEMES.emerald.name).toBe("emerald");
      expect(THEMES.emerald.label).toBe("Emerald");
    });

    it("roseテーマが存在する", () => {
      expect(THEMES.rose).toBeDefined();
      expect(THEMES.rose.name).toBe("rose");
      expect(THEMES.rose.label).toBe("Rose");
    });

    it("amberテーマが存在する", () => {
      expect(THEMES.amber).toBeDefined();
      expect(THEMES.amber.name).toBe("amber");
      expect(THEMES.amber.label).toBe("Amber");
    });

    it("skyテーマが存在する", () => {
      expect(THEMES.sky).toBeDefined();
      expect(THEMES.sky.name).toBe("sky");
      expect(THEMES.sky.label).toBe("Sky");
    });

    it("各テーマに必要な色プロパティが存在する", () => {
      const requiredColorKeys = [
        "background",
        "card",
        "text",
        "subText",
        "border",
        "primary",
        "primaryDark",
        "primaryLight",
        "accentFrom",
        "accentVia",
        "accentTo",
        "activeTab",
        "glow",
        "error",
        "success",
        "gradient",
        "accentGradient",
      ];

      Object.values(THEMES).forEach((theme) => {
        requiredColorKeys.forEach((key) => {
          expect(theme.colors).toHaveProperty(key);
        });
      });
    });

    it("全テーマのbackgroundが黒である", () => {
      Object.values(THEMES).forEach((theme) => {
        expect(theme.colors.background).toBe("#000000");
      });
    });

    it("全テーマのtextが白である", () => {
      Object.values(THEMES).forEach((theme) => {
        expect(theme.colors.text).toBe("#ffffff");
      });
    });

    it("各テーマのgradientが2色の配列である", () => {
      Object.values(THEMES).forEach((theme) => {
        expect(theme.colors.gradient).toHaveLength(2);
      });
    });

    it("各テーマのaccentGradientが3色の配列である", () => {
      Object.values(THEMES).forEach((theme) => {
        expect(theme.colors.accentGradient).toHaveLength(3);
      });
    });

    it("glowがrgba形式である", () => {
      const rgbaPattern = /^rgba\(\d+, \d+, \d+, [\d.]+\)$/;
      Object.values(THEMES).forEach((theme) => {
        expect(theme.colors.glow).toMatch(rgbaPattern);
      });
    });
  });
});
