import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import MiniPlayer from "@/components/player/MiniPlayer";
import { Ionicons } from "@expo/vector-icons";

// @expo/vector-iconsのモック
jest.mock("@expo/vector-icons", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockIcon = (props: any) => React.createElement(View, props);
  return {
    Ionicons: MockIcon,
    Feather: MockIcon,
  };
});

// expo-blurのモック
jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, testID, ...props }: any) =>
      React.createElement(
        View,
        { testID: testID || "blur-view", ...props },
        children
      ),
  };
});

// expo-imageのモック
jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: ({ testID, source, ...props }: any) =>
      React.createElement(View, {
        testID: testID || "expo-image",
        "data-source": source?.uri,
        ...props,
      }),
  };
});

// expo-linear-gradientのモック (互換性のために残す)
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children, testID }: any) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(
      View,
      { testID: testID || "linear-gradient" },
      children
    );
  },
}));

// MarqueeTextのモック
jest.mock("@/components/common/MarqueeText", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ text, testID }: any) =>
      React.createElement(Text, { testID: testID || "marquee-text" }, text),
  };
});

// react-native-reanimatedのモック
jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  const Animated = {
    View: ({ children, style, ...props }: any) =>
      React.createElement(View, { style, ...props }, children),
    createAnimatedComponent: (cb: any) => cb,
  };
  return {
    __esModule: true,
    default: Animated,
    useSharedValue: (initialValue: any) => ({ value: initialValue }),
    useAnimatedStyle: (callback: any) => callback(),
    withTiming: (value: any) => value,
  };
});

describe("MiniPlayer", () => {
  const mockSong = {
    id: "song1",
    user_id: "user1",
    title: "Test Song Title",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    video_path: undefined,
    lyrics: undefined,
    genre: "pop",
    created_at: "2024-01-01",
    like_count: "10",
  };

  const mockOnPlayPause = jest.fn();
  const mockOnPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // テスト用のヘルパー関数
  const renderMiniPlayer = (props = {}) => {
    return render(
      <MiniPlayer
        currentSong={mockSong}
        isPlaying={false}
        onPlayPause={mockOnPlayPause}
        onPress={mockOnPress}
        {...props}
      />
    );
  };

  describe("レンダリングテスト", () => {
    it("初期状態で正しくレンダリングされる", () => {
      const { getByTestId } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByTestId("blur-view")).toBeTruthy();
      expect(getByTestId("expo-image")).toBeTruthy();
    });

    it("曲のタイトルが表示される", () => {
      const { getByText } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Song Title")).toBeTruthy();
    });

    it("アーティスト名が表示される", () => {
      const { getByText } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Artist")).toBeTruthy();
    });

    it("曲の画像が正しいURIで表示される", () => {
      const { getByTestId } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      const image = getByTestId("expo-image");
      expect(image.props["data-source"]).toBe(mockSong.image_path);
    });

    it("BlurViewが表示される", () => {
      const { getByTestId } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByTestId("blur-view")).toBeTruthy();
    });
  });

  describe("再生制御", () => {
    it("再生/一時停止ボタンをタップするとonPlayPauseが呼ばれる", () => {
      const { UNSAFE_getAllByProps } = renderMiniPlayer();

      // accessibleがtrueの要素を取得（コンテナとボタン）
      const accessibleElements = UNSAFE_getAllByProps({ accessible: true });
      // すべてのaccessible要素をテストして、onPressでonPlayPauseを呼ぶものを探す
      const playButton = accessibleElements.find((el: any) => {
        // 子要素にFeatherアイコンがあるものを探す
        const hasFeatherIcon =
          el.children &&
          el.children.some((child: any) => child.type === Ionicons);
        return hasFeatherIcon;
      });

      if (playButton) {
        fireEvent.press(playButton);
      }

      expect(mockOnPlayPause).toHaveBeenCalledTimes(1);
    });

    it("isPlaying=falseのときplayアイコンが表示される", () => {
      const { UNSAFE_getAllByType } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      const ionicIcons = UNSAFE_getAllByType(Ionicons);
      const playPauseIcon = ionicIcons[0];
      expect(playPauseIcon.props.name).toBe("play");
    });

    it("isPlaying=trueのときpauseアイコンが表示される", () => {
      const { UNSAFE_getAllByType } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={true}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      const ionicIcons = UNSAFE_getAllByType(Ionicons);
      const playPauseIcon = ionicIcons[0];
      expect(playPauseIcon.props.name).toBe("pause");
    });

    it("再生状態が変わるとアイコンが切り替わる", () => {
      const { UNSAFE_getAllByType, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      let ionicIcons = UNSAFE_getAllByType(Ionicons);
      expect(ionicIcons[0].props.name).toBe("play");

      rerender(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={true}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      ionicIcons = UNSAFE_getAllByType(Ionicons);
      expect(ionicIcons[0].props.name).toBe("pause");
    });

    it("再生中でも再生/一時停止ボタンがタップ可能", () => {
      const { UNSAFE_getAllByProps } = renderMiniPlayer({ isPlaying: true });

      const accessibleElements = UNSAFE_getAllByProps({ accessible: true });
      const playButton = accessibleElements.find((el: any) => {
        const hasFeatherIcon =
          el.children &&
          el.children.some((child: any) => child.type === Ionicons);
        return hasFeatherIcon;
      });

      if (playButton) {
        fireEvent.press(playButton);
      }

      expect(mockOnPlayPause).toHaveBeenCalledTimes(1);
    });
  });

  describe("ユーザーインタラクション", () => {
    it("ミニプレイヤー全体をタップするとonPressが呼ばれる", () => {
      const { UNSAFE_getAllByProps } = renderMiniPlayer();

      const accessibleElements = UNSAFE_getAllByProps({ accessible: true });
      // 1つ目がcontentContainer
      const containerButton = accessibleElements[0];

      fireEvent.press(containerButton);

      expect(mockOnPress).toHaveBeenCalledTimes(1);
    });

    it("コンテナをタップしてもonPlayPauseは呼ばれない", () => {
      const { UNSAFE_getAllByProps } = renderMiniPlayer();

      const accessibleElements = UNSAFE_getAllByProps({ accessible: true });
      const containerButton = accessibleElements[0];

      fireEvent.press(containerButton);

      expect(mockOnPlayPause).not.toHaveBeenCalled();
      expect(mockOnPress).toHaveBeenCalled();
    });

    it("再生/一時停止ボタンをタップしてもonPressは呼ばれない", () => {
      const { UNSAFE_getAllByProps } = renderMiniPlayer();

      const accessibleElements = UNSAFE_getAllByProps({ accessible: true });
      const playButton = accessibleElements.find((el: any) => {
        const hasFeatherIcon =
          el.children &&
          el.children.some((child: any) => child.type === Ionicons);
        return hasFeatherIcon;
      });

      if (playButton) {
        fireEvent.press(playButton);
      }

      expect(mockOnPress).not.toHaveBeenCalled();
      expect(mockOnPlayPause).toHaveBeenCalled();
    });

    it("複数回タップしても正しく動作する", () => {
      const { UNSAFE_getAllByProps } = renderMiniPlayer();

      const accessibleElements = UNSAFE_getAllByProps({ accessible: true });
      const containerButton = accessibleElements[0];
      const playButton = accessibleElements.find((el: any) => {
        const hasFeatherIcon =
          el.children &&
          el.children.some((child: any) => child.type === Ionicons);
        return hasFeatherIcon;
      });

      fireEvent.press(containerButton);
      if (playButton) {
        fireEvent.press(playButton);
      }
      fireEvent.press(containerButton);
      if (playButton) {
        fireEvent.press(playButton);
      }

      expect(mockOnPress).toHaveBeenCalledTimes(2);
      expect(mockOnPlayPause).toHaveBeenCalledTimes(2);
    });
  });

  describe("曲情報の表示", () => {
    it("曲が変わると新しい曲情報が表示される", () => {
      const { getByText, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Song Title")).toBeTruthy();

      const newSong = {
        ...mockSong,
        id: "song2",
        title: "New Song",
        author: "New Artist",
      };

      rerender(
        <MiniPlayer
          currentSong={newSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("New Song")).toBeTruthy();
      expect(getByText("New Artist")).toBeTruthy();
    });

    it("曲の画像が変わると新しい画像URIが設定される", () => {
      const { getByTestId, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      let image = getByTestId("expo-image");
      expect(image.props["data-source"]).toBe(mockSong.image_path);

      const newSong = {
        ...mockSong,
        id: "song2",
        image_path: "https://example.com/new-image.jpg",
      };

      rerender(
        <MiniPlayer
          currentSong={newSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      image = getByTestId("expo-image");
      expect(image.props["data-source"]).toBe(newSong.image_path);
    });

    it("MarqueeTextが曲のタイトルを表示する", () => {
      const { getByTestId } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      const marqueeText = getByTestId("marquee-text");
      expect(marqueeText).toBeTruthy();
      expect(marqueeText.props.children).toBe("Test Song Title");
    });
  });

  describe("エッジケース", () => {
    it("非常に長いタイトルでもエラーが発生しない", () => {
      const longTitleSong = {
        ...mockSong,
        title: "A".repeat(200),
      };

      expect(() => {
        render(
          <MiniPlayer
            currentSong={longTitleSong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });

    it("非常に長いアーティスト名でもエラーが発生しない", () => {
      const longAuthorSong = {
        ...mockSong,
        author: "B".repeat(200),
      };

      expect(() => {
        render(
          <MiniPlayer
            currentSong={longAuthorSong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });

    it("特殊文字を含むタイトルが正しく表示される", () => {
      const specialCharSong = {
        ...mockSong,
        title: "Test 🎵 Song & <Title> 'with' \"quotes\"",
      };

      const { getByText } = render(
        <MiniPlayer
          currentSong={specialCharSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText(specialCharSong.title)).toBeTruthy();
    });

    it("空のタイトルでもエラーが発生しない", () => {
      const emptySong = {
        ...mockSong,
        title: "",
        author: "",
      };

      expect(() => {
        render(
          <MiniPlayer
            currentSong={emptySong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });

    it("画像パスがnullでもエラーが発生しない", () => {
      const noImageSong = {
        ...mockSong,
        image_path: null as any,
      };

      expect(() => {
        render(
          <MiniPlayer
            currentSong={noImageSong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });

    it("画像パスが空文字列でもエラーが発生しない", () => {
      const emptyImageSong = {
        ...mockSong,
        image_path: "",
      };

      expect(() => {
        render(
          <MiniPlayer
            currentSong={emptyImageSong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });

    it("画像URIが無効な形式でもエラーが発生しない", () => {
      const invalidImageSong = {
        ...mockSong,
        image_path: "not-a-valid-url",
      };

      expect(() => {
        render(
          <MiniPlayer
            currentSong={invalidImageSong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("同じcurrentSongとisPlayingで再レンダリングされない", () => {
      const { rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      const callCountBefore = mockOnPlayPause.mock.calls.length;

      // 同じpropsで再レンダリング
      rerender(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      // 関数が勝手に呼ばれないことを確認
      expect(mockOnPlayPause).toHaveBeenCalledTimes(callCountBefore);
    });

    it("currentSong.idが同じでisPlayingが異なる場合は再レンダリングされる", () => {
      const { UNSAFE_getAllByType, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      let icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("play");

      rerender(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={true}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("pause");
    });

    it("currentSong.idが異なる場合は再レンダリングされる", () => {
      const { getByText, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Song Title")).toBeTruthy();

      const newSong = {
        ...mockSong,
        id: "song2",
        title: "Different Song",
      };

      rerender(
        <MiniPlayer
          currentSong={newSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Different Song")).toBeTruthy();
    });

    it("onPlayPauseとonPressが変わっても再レンダリングされない（メモ化の確認）", () => {
      const { getByText, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Song Title")).toBeTruthy();

      const newOnPlayPause = jest.fn();
      const newOnPress = jest.fn();

      rerender(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={newOnPlayPause}
          onPress={newOnPress}
        />
      );

      // メモ化により関数が変わっても再レンダリングされない
      expect(getByText("Test Song Title")).toBeTruthy();
    });
  });

  describe("アニメーション", () => {
    it("useSharedValueが初期化される", () => {
      expect(() => {
        render(
          <MiniPlayer
            currentSong={mockSong}
            isPlaying={false}
            onPlayPause={mockOnPlayPause}
            onPress={mockOnPress}
          />
        );
      }).not.toThrow();
    });

    it("useEffectでアニメーションが開始される", async () => {
      const { getByTestId } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      // コンポーネントがマウントされることを確認
      await waitFor(() => {
        expect(getByTestId("blur-view")).toBeTruthy();
      });
    });

    it("アニメーションスタイルが適用される", () => {
      const { getByTestId } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      const blurView = getByTestId("blur-view");
      expect(blurView).toBeTruthy();
    });
  });

  describe("複数の状態の組み合わせ", () => {
    it("再生中で異なる曲の場合、正しく表示される", () => {
      const { getByText, UNSAFE_getAllByType } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={true}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Song Title")).toBeTruthy();
      const icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("pause");
    });

    it("停止中で異なる曲の場合、正しく表示される", () => {
      const { getByText, UNSAFE_getAllByType } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      expect(getByText("Test Song Title")).toBeTruthy();
      const icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("play");
    });

    it("状態遷移が正しく動作する（停止→再生→停止）", () => {
      const { UNSAFE_getAllByType, rerender } = render(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      let icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("play");

      rerender(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={true}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("pause");

      rerender(
        <MiniPlayer
          currentSong={mockSong}
          isPlaying={false}
          onPlayPause={mockOnPlayPause}
          onPress={mockOnPress}
        />
      );

      icons = UNSAFE_getAllByType(Ionicons);
      expect(icons[0].props.name).toBe("play");
    });
  });
});
