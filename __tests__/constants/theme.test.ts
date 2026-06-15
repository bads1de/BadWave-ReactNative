import { COLORS, FONTS, GRADIENTS } from "@/constants/theme";

describe("theme", () => {
  describe("COLORS", () => {
    it("primaryが定義されている", () => {
      expect(COLORS.primary).toBe("#4c1d95");
    });

    it("secondaryが定義されている", () => {
      expect(COLORS.secondary).toBe("#18181b");
    });

    it("backgroundが定義されている", () => {
      expect(COLORS.background).toBe("#000000");
    });

    it("textが定義されている", () => {
      expect(COLORS.text).toBe("#ffffff");
    });

    it("subTextが定義されている", () => {
      expect(COLORS.subText).toBe("#a1a1aa");
    });

    it("errorが定義されている", () => {
      expect(COLORS.error).toBe("#ef4444");
    });

    it("successが定義されている", () => {
      expect(COLORS.success).toBe("#22c55e");
    });

    it("borderが定義されている", () => {
      expect(COLORS.border).toBe("#27272a");
    });

    it("cardが定義されている", () => {
      expect(COLORS.card).toBe("#18181b");
    });

    it("全カラーコードが有効な16進数形式である", () => {
      const hexPattern = /^#[0-9A-Fa-f]{6}$/;
      Object.values(COLORS).forEach((color) => {
        expect(color).toMatch(hexPattern);
      });
    });
  });

  describe("FONTS", () => {
    it("titleが定義されている", () => {
      expect(FONTS.title).toBe("BodoniModa_700Bold");
    });

    it("bodyが定義されている", () => {
      expect(FONTS.body).toBe("Jost_400Regular");
    });

    it("semiboldが定義されている", () => {
      expect(FONTS.semibold).toBe("Jost_600SemiBold");
    });

    it("boldが定義されている", () => {
      expect(FONTS.bold).toBe("Jost_700Bold");
    });
  });

  describe("GRADIENTS", () => {
    it("primaryが定義されている", () => {
      expect(GRADIENTS.primary).toEqual(["#4c1d95", "#000000"]);
    });

    it("successが定義されている", () => {
      expect(GRADIENTS.success).toEqual(["#22c55e", "#166534"]);
    });

    it("errorが定義されている", () => {
      expect(GRADIENTS.error).toEqual(["#ef4444", "#991b1b"]);
    });

    it("pinkBlueが定義されている", () => {
      expect(GRADIENTS.pinkBlue).toEqual(["#7c3aed", "#ec4899"]);
    });

    it("各グラデーションが2色の配列である", () => {
      Object.values(GRADIENTS).forEach((gradient) => {
        expect(gradient).toHaveLength(2);
      });
    });
  });
});
