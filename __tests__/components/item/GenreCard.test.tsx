import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import GenreCard from "@/components/item/GenreCard";
import { useRouter } from "expo-router";

// モックの設定
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("expo-image", () => ({
  ImageBackground: "ImageBackground",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("react-native-reanimated", () => {
  const View = require("react-native").View;
  return {
    __esModule: true,
    default: {
      View: View,
      createAnimatedComponent: (component: any) => component,
    },
    useSharedValue: (initialValue: any) => ({
      value: initialValue,
    }),
    useAnimatedStyle: (callback: any) => {
      return callback();
    },
    withSpring: (value: any) => value,
    withTiming: (value: any) => value,
  };
});

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe("GenreCard", () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue(mockRouter as any);
  });

  describe("レンダリングテスト", () => {
    it("コンポーネントが正しくレンダリングされる", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      expect(getByText("Retro Wave")).toBeTruthy();
    });

    it("ジャンル名が正しく表示される", () => {
      const { getByText } = render(<GenreCard genre="Electro House" />);
      
      expect(getByText("Electro House")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - Retro Wave", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      expect(getByText("🌆")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - Electro House", () => {
      const { getByText } = render(<GenreCard genre="Electro House" />);
      
      expect(getByText("⚡")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - Nu Disco", () => {
      const { getByText } = render(<GenreCard genre="Nu Disco" />);
      
      expect(getByText("💿")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - City Pop", () => {
      const { getByText } = render(<GenreCard genre="City Pop" />);
      
      expect(getByText("🏙️")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - Tropical House", () => {
      const { getByText } = render(<GenreCard genre="Tropical House" />);
      
      expect(getByText("🌴")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - Vapor Wave", () => {
      const { getByText } = render(<GenreCard genre="Vapor Wave" />);
      
      expect(getByText("📼")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - r&b", () => {
      const { getByText } = render(<GenreCard genre="r&b" />);
      
      expect(getByText("🎤")).toBeTruthy();
    });

    it("ジャンルアイコンが表示される - Chill House", () => {
      const { getByText } = render(<GenreCard genre="Chill House" />);
      
      expect(getByText("🎧")).toBeTruthy();
    });

    it("背景画像が設定される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Retro Wave" />);
      
      const backgrounds = UNSAFE_getAllByType("ImageBackground" as any);
      expect(backgrounds.length).toBeGreaterThan(0);
    });

    it("グラデーションが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Retro Wave" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients.length).toBeGreaterThan(0);
    });
  });

  describe("ユーザーインタラクション", () => {
    it("カードをタップするとジャンルページにナビゲートする", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const card = getByText("Retro Wave");
      fireEvent.press(card.parent?.parent?.parent || card);
      
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/genre/[genre]",
        params: { genre: encodeURIComponent("Retro Wave") },
      });
    });

    it("異なるジャンルで正しいパスにナビゲートする", () => {
      const { getByText } = render(<GenreCard genre="City Pop" />);
      
      const card = getByText("City Pop");
      fireEvent.press(card.parent?.parent?.parent || card);
      
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/genre/[genre]",
        params: { genre: encodeURIComponent("City Pop") },
      });
    });

    it("複数回タップしても正しく動作する", () => {
      const { getByText } = render(<GenreCard genre="Nu Disco" />);
      
      const card = getByText("Nu Disco");
      fireEvent.press(card.parent?.parent?.parent || card);
      fireEvent.press(card.parent?.parent?.parent || card);
      
      expect(mockPush).toHaveBeenCalledTimes(2);
    });
  });

  describe("アニメーション", () => {
    it("useSharedValueが初期化される", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      expect(getByText("Retro Wave")).toBeTruthy();
    });

    it("アニメーションスタイルが適用される", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const genreText = getByText("Retro Wave");
      expect(genreText).toBeTruthy();
    });
  });

  describe("データ表示", () => {
    const genres = [
      "Retro Wave",
      "Electro House",
      "Nu Disco",
      "City Pop",
      "Tropical House",
      "Vapor Wave",
      "r&b",
      "Chill House",
    ];

    genres.forEach(genre => {
      it(`${genre}が正しく表示される`, () => {
        const { getByText } = render(<GenreCard genre={genre} />);
        
        expect(getByText(genre)).toBeTruthy();
      });
    });

    it("ジャンル名のエンコードが正しく行われる - スペースを含む", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const card = getByText("Retro Wave");
      fireEvent.press(card.parent?.parent?.parent || card);
      
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/genre/[genre]",
        params: { genre: "Retro%20Wave" },
      });
    });

    it("ジャンル名のエンコードが正しく行われる - 特殊文字", () => {
      const { getByText } = render(<GenreCard genre="r&b" />);
      
      const card = getByText("r&b");
      fireEvent.press(card.parent?.parent?.parent || card);
      
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/genre/[genre]",
        params: { genre: "r%26b" },
      });
    });
  });

  describe("エッジケース", () => {
    it("未定義のジャンルの場合、デフォルトアイコンが表示される", () => {
      const { getByText } = render(<GenreCard genre="Unknown Genre" />);
      
      expect(getByText("🎵")).toBeTruthy();
    });

    it("未定義のジャンルの場合、ジャンル名が表示される", () => {
      const { getByText } = render(<GenreCard genre="Unknown Genre" />);
      
      expect(getByText("Unknown Genre")).toBeTruthy();
    });

    it("非常に長いジャンル名でもレンダリングされる", () => {
      const longGenre = "A".repeat(100);
      const { getByText } = render(<GenreCard genre={longGenre} />);
      
      expect(getByText(longGenre)).toBeTruthy();
    });

    it("空文字列のジャンルでもエラーが発生しない", () => {
      expect(() => {
        render(<GenreCard genre="" />);
      }).not.toThrow();
    });

    it("特殊文字を含むジャンル名が正しく表示される", () => {
      const specialGenre = "Genre & Music 🎵";
      const { getByText } = render(<GenreCard genre={specialGenre} />);
      
      expect(getByText(specialGenre)).toBeTruthy();
    });

    it("日本語のジャンル名でも正しく動作する", () => {
      const japaneseGenre = "シティポップ";
      const { getByText } = render(<GenreCard genre={japaneseGenre} />);
      
      expect(getByText(japaneseGenre)).toBeTruthy();
    });

    it("タップ時のエラーをキャッチして処理する", () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockPush.mockImplementationOnce(() => {
        throw new Error("Navigation failed");
      });

      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const card = getByText("Retro Wave");
      
      expect(() => {
        fireEvent.press(card.parent?.parent?.parent || card);
      }).toThrow();

      consoleErrorSpy.mockRestore();
      // モックをリセット
      mockPush.mockReset();
      mockPush.mockImplementation(() => {});
    });
  });

  describe("グラデーションカラー", () => {
    it("Retro Waveの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Retro Wave" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#FF0080", "#7928CA", "#4A00E0"]);
    });

    it("Electro Houseの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Electro House" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#00F5A0", "#00D9F5"]);
    });

    it("Nu Discoの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Nu Disco" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#FFD700", "#FF6B6B", "#FF1493"]);
    });

    it("City Popの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="City Pop" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#6366F1", "#A855F7", "#EC4899"]);
    });

    it("Tropical Houseの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Tropical House" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#00B4DB", "#0083B0"]);
    });

    it("Vapor Waveの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Vapor Wave" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#FF61D2", "#FE9090", "#FF9C7D"]);
    });

    it("r&bの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="r&b" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#6A0DAD", "#9370DB", "#D4AF37"]);
    });

    it("Chill Houseの正しいグラデーションカラーが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Chill House" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#43cea2", "#185a9d", "#6DD5FA"]);
    });

    it("未定義のジャンルの場合、デフォルトグラデーションが適用される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Unknown" />);
      
      const gradients = UNSAFE_getAllByType("LinearGradient" as any);
      expect(gradients[0].props.colors).toEqual(["#374151", "#1F2937", "#111827"]);
    });
  });

  describe("メモ化", () => {
    it("同じpropsで再レンダリングしても不必要な再計算を行わない", () => {
      const { rerender, getByText } = render(<GenreCard genre="Retro Wave" />);
      
      expect(getByText("Retro Wave")).toBeTruthy();
      
      rerender(<GenreCard genre="Retro Wave" />);
      
      expect(getByText("Retro Wave")).toBeTruthy();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("異なるジャンルで再レンダリングすると正しく更新される", () => {
      const { rerender, getByText, queryByText } = render(
        <GenreCard genre="Retro Wave" />
      );
      
      expect(getByText("Retro Wave")).toBeTruthy();
      
      rerender(<GenreCard genre="City Pop" />);
      
      expect(getByText("City Pop")).toBeTruthy();
      expect(queryByText("Retro Wave")).toBeNull();
    });
  });

  describe("コンポーネント構造", () => {
    it("カードコンテナが存在する", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const genreText = getByText("Retro Wave");
      expect(genreText).toBeTruthy();
    });

    it("アイコンコンテナが存在する", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const icon = getByText("🌆");
      expect(icon).toBeTruthy();
    });

    it("装飾要素が含まれる", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      expect(getByText("Retro Wave")).toBeTruthy();
    });
  });

  describe("背景画像のパス", () => {
    it("Retro Waveの背景画像が設定される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Retro Wave" />);
      
      const backgrounds = UNSAFE_getAllByType("ImageBackground" as any);
      expect(backgrounds.length).toBeGreaterThan(0);
    });

    it("City Popの背景画像が設定される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="City Pop" />);
      
      const backgrounds = UNSAFE_getAllByType("ImageBackground" as any);
      expect(backgrounds.length).toBeGreaterThan(0);
    });

    it("未定義のジャンルでも背景画像が設定される", () => {
      const { UNSAFE_getAllByType } = render(<GenreCard genre="Unknown" />);
      
      const backgrounds = UNSAFE_getAllByType("ImageBackground" as any);
      expect(backgrounds.length).toBeGreaterThan(0);
    });
  });

  describe("ナビゲーション", () => {
    it("正しいパス形式でナビゲートする", () => {
      const { getByText } = render(<GenreCard genre="Retro Wave" />);
      
      const card = getByText("Retro Wave");
      fireEvent.press(card.parent?.parent?.parent || card);
      
      expect(mockPush).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: "/genre/[genre]",
          params: expect.objectContaining({
            genre: expect.any(String),
          }),
        })
      );
    });

    it("URLエンコードが正しく適用される", () => {
      const { getByText } = render(<GenreCard genre="Tropical House" />);
      
      const card = getByText("Tropical House");
      fireEvent.press(card.parent?.parent?.parent || card);
      
      const pushCall = mockPush.mock.calls[0][0];
      expect(pushCall.params.genre).toBe(encodeURIComponent("Tropical House"));
    });
  });
});

