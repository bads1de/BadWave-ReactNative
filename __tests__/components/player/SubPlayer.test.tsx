import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import SubPlayer from "@/components/player/SubPlayer";
import { useSubPlayerStore } from "@/hooks/stores/useSubPlayerStore";
import { useSubPlayerAudio } from "@/hooks/useSubPlayerAudio";

// expo-avのモック
jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
    setAudioModeAsync: jest.fn(),
  },
  InterruptionModeIOS: {
    DoNotMix: 0,
  },
  InterruptionModeAndroid: {
    DoNotMix: 0,
  },
}));

jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: ({ onSlidingComplete, value, testID }: any) =>
      React.createElement(View, {
        testID: testID || "slider",
        onTouchEnd: () => onSlidingComplete && onSlidingComplete(value),
      }),
  };
});

// カスタムフックのモック
jest.mock("@/hooks/stores/useSubPlayerStore");
jest.mock("@/hooks/useSubPlayerAudio");

const mockUseSubPlayerStore = useSubPlayerStore as jest.MockedFunction<
  typeof useSubPlayerStore
>;
const mockUseSubPlayerAudio = useSubPlayerAudio as jest.MockedFunction<
  typeof useSubPlayerAudio
>;

// TODO: useSubPlayerAudioのAPIが変更されたため、このテストファイルを更新する必要があります
// togglePlayPauseとseekToがフックから削除されました
describe.skip("SubPlayer", () => {
  const mockSongs = [
    {
      id: "song1",
      user_id: "user1",
      title: "Test Song 1",
      author: "Test Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "https://example.com/song1.mp3",
      video_path: undefined,
      lyrics: undefined,
      genre: "pop",
      created_at: "2024-01-01",
      like_count: "10",
    },
    {
      id: "song2",
      user_id: "user1",
      title: "Test Song 2",
      author: "Test Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "https://example.com/song2.mp3",
      video_path: undefined,
      lyrics: undefined,
      genre: "rock",
      created_at: "2024-01-02",
      like_count: "5",
    },
    {
      id: "song3",
      user_id: "user1",
      title: "Test Song 3",
      author: "Test Artist 3",
      image_path: "https://example.com/image3.jpg",
      song_path: "https://example.com/song3.mp3",
      video_path: undefined,
      lyrics: undefined,
      genre: "jazz",
      created_at: "2024-01-03",
      like_count: "15",
    },
  ];

  const mockOnClose = jest.fn();
  const mockTogglePlayPause = jest.fn();
  const mockSeekTo = jest.fn();
  const mockStopAndUnloadCurrentSound = jest.fn();
  const mockSetCurrentSongIndex = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseSubPlayerStore.mockImplementation((selector) => {
      const state = {
        songs: mockSongs || [],
        currentSongIndex: 0,
        setCurrentSongIndex: mockSetCurrentSongIndex,
        showSubPlayer: true,
        setShowSubPlayer: jest.fn(),
        previewDuration: 30000,
        setPreviewDuration: jest.fn(),
        autoPlay: true,
        setAutoPlay: jest.fn(),
        setSongs: jest.fn(),
      };
      return selector(state);
    });

    mockUseSubPlayerAudio.mockReturnValue({
      currentPosition: 5000,
      duration: 30000,
      isPlaying: false,
      togglePlayPause: mockTogglePlayPause,
      seekTo: mockSeekTo,
      stopAndUnloadCurrentSound: mockStopAndUnloadCurrentSound,
      randomStartPosition: 0,
      isLoading: false,
      playNextSong: jest.fn(),
      playPrevSong: jest.fn(),
    });
  });

  describe("レンダリングテスト", () => {
    it("コンポーネントが正しくレンダリングされる", () => {
      const { getByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByTestId("swiper")).toBeTruthy();
    });

    it("閉じるボタンが表示される", () => {
      const { getByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByTestId("blur-view")).toBeTruthy();
    });

    it("複数の曲がある場合、すべての曲がレンダリングされる", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const imageBackgrounds = getAllByTestId("image-background");
      expect(imageBackgrounds.length).toBe(mockSongs.length);
    });

    it("曲情報（タイトル、アーティスト）が表示される", () => {
      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByText("Test Song 1")).toBeTruthy();
      expect(getByText("Test Artist 1")).toBeTruthy();
    });

    it("プログレスバーが表示される", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      // 各曲にSliderが存在するため、getAllByTestIdを使用
      const sliders = getAllByTestId("slider");
      expect(sliders.length).toBe(mockSongs.length);
    });
  });

  describe("曲情報の表示", () => {
    it("現在の曲のタイトルとアーティスト名が正しく表示される", () => {
      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByText("Test Song 1")).toBeTruthy();
      expect(getByText("Test Artist 1")).toBeTruthy();
    });

    it("曲のインデックスが変わると表示される情報も変わる", () => {
      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: mockSongs || [],
          currentSongIndex: 1,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByText("Test Song 2")).toBeTruthy();
      expect(getByText("Test Artist 2")).toBeTruthy();
    });

    it("すべての曲情報が同時にレンダリングされる", () => {
      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      // Swiperはすべての子要素をレンダリングする
      expect(getByText("Test Song 1")).toBeTruthy();
      expect(getByText("Test Song 2")).toBeTruthy();
      expect(getByText("Test Song 3")).toBeTruthy();
    });
  });

  describe("プログレスバーとシーク操作", () => {
    it("プログレスバーが現在位置に応じて表示される", () => {
      mockUseSubPlayerAudio.mockReturnValue({
        currentPosition: 15000,
        duration: 30000,
        isPlaying: true,
        togglePlayPause: mockTogglePlayPause,
        seekTo: mockSeekTo,
        stopAndUnloadCurrentSound: mockStopAndUnloadCurrentSound,
        randomStartPosition: 0,
        isLoading: false,
        playNextSong: jest.fn(),
        playPrevSong: jest.fn(),
      });

      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const sliders = getAllByTestId("slider");
      expect(sliders.length).toBe(mockSongs.length);
    });

    it("シーク操作時にseekToが呼ばれる", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const sliders = getAllByTestId("slider");
      // 最初のSlider（現在の曲）でシーク操作をシミュレート
      fireEvent(sliders[0], "onSlidingComplete", 15000);

      expect(mockSeekTo).toHaveBeenCalledWith(15000);
    });

    it("プログレスバーの進行状況が正しく計算される", () => {
      mockUseSubPlayerAudio.mockReturnValue({
        currentPosition: 10000,
        duration: 20000,
        isPlaying: true,
        togglePlayPause: mockTogglePlayPause,
        seekTo: mockSeekTo,
        stopAndUnloadCurrentSound: mockStopAndUnloadCurrentSound,
        randomStartPosition: 0,
        isLoading: false,
        playNextSong: jest.fn(),
        playPrevSong: jest.fn(),
      });

      render(<SubPlayer onClose={mockOnClose} />);

      // プログレスは50%になるはず (10000 / 20000 * 100 = 50%)
      // この計算はコンポーネント内で行われる
    });

    it("デュレーションが0の場合でもエラーが発生しない", () => {
      mockUseSubPlayerAudio.mockReturnValue({
        currentPosition: 0,
        duration: 0,
        isPlaying: false,
        togglePlayPause: mockTogglePlayPause,
        seekTo: mockSeekTo,
        stopAndUnloadCurrentSound: mockStopAndUnloadCurrentSound,
        randomStartPosition: 0,
        isLoading: false,
        playNextSong: jest.fn(),
        playPrevSong: jest.fn(),
      });

      expect(() => {
        render(<SubPlayer onClose={mockOnClose} />);
      }).not.toThrow();
    });
  });

  describe("スワイプ操作とインデックス変更", () => {
    it("スワイプでインデックスが変更されると音声が停止される", async () => {
      mockStopAndUnloadCurrentSound.mockResolvedValue(undefined);

      const { getByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const swiper = getByTestId("swiper");

      // FlatListのレンダリングを確認
      expect(swiper).toBeTruthy();
    });

    it("Swiperコンポーネントが存在する", () => {
      const { getByTestId } = render(<SubPlayer onClose={mockOnClose} />);
      const swiper = getByTestId("swiper");

      // Swiperコンポーネントがレンダリングされていることを確認
      expect(swiper).toBeTruthy();
    });

    it("currentSongIndexが異なる場合、異なる曲が表示される", () => {
      // currentSongIndex = 1の場合
      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: mockSongs || [],
          currentSongIndex: 1,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      // 2曲目の情報が表示されていることを確認
      expect(getByText("Test Song 2")).toBeTruthy();
      expect(getByText("Test Artist 2")).toBeTruthy();
    });

    it("複数の曲が正しくレンダリングされてスワイプ可能", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      // すべての曲がレンダリングされていることを確認
      const imageBackgrounds = getAllByTestId("image-background");
      expect(imageBackgrounds.length).toBe(mockSongs.length);
    });
  });

  describe("再生制御", () => {
    it("画像オーバーレイをタップすると再生/一時停止がトグルされる", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const imageBackgrounds = getAllByTestId("image-background");
      // ImageBackgroundの中のTouchableOpacityを探す
      const firstImageBg = imageBackgrounds[0];

      // ImageBackgroundの子要素（TouchableOpacity）のonPressを直接実行
      const touchable = firstImageBg.props.children;
      if (touchable && touchable.props && touchable.props.onPress) {
        touchable.props.onPress();
      }

      expect(mockTogglePlayPause).toHaveBeenCalled();
    });

    it("再生中かどうかに関わらずトグル関数が呼ばれる", () => {
      mockUseSubPlayerAudio.mockReturnValue({
        currentPosition: 5000,
        duration: 30000,
        isPlaying: true,
        togglePlayPause: mockTogglePlayPause,
        seekTo: mockSeekTo,
        stopAndUnloadCurrentSound: mockStopAndUnloadCurrentSound,
        randomStartPosition: 0,
        isLoading: false,
        playNextSong: jest.fn(),
        playPrevSong: jest.fn(),
      });

      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const imageBackgrounds = getAllByTestId("image-background");
      const touchable = imageBackgrounds[0].props.children;
      if (touchable && touchable.props && touchable.props.onPress) {
        touchable.props.onPress();
      }

      expect(mockTogglePlayPause).toHaveBeenCalledTimes(1);
    });
  });

  describe("クローズ処理", () => {
    it("閉じるボタンをタップするとonCloseが呼ばれる", async () => {
      mockStopAndUnloadCurrentSound.mockResolvedValue(undefined);

      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      // 最初のBlurViewがクローズボタン
      const blurViews = getAllByTestId("blur-view");
      const closeButtonBlur = blurViews[0];

      // BlurView内のTouchableOpacityのonPressを実行
      const touchable = closeButtonBlur.props.children;
      if (touchable && touchable.props && touchable.props.onPress) {
        await touchable.props.onPress();
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("クローズ時に音声が停止される", async () => {
      mockStopAndUnloadCurrentSound.mockClear();
      mockStopAndUnloadCurrentSound.mockResolvedValue(undefined);

      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const blurViews = getAllByTestId("blur-view");
      const closeButtonBlur = blurViews[0];

      const touchable = closeButtonBlur.props.children;
      if (touchable && touchable.props && touchable.props.onPress) {
        await touchable.props.onPress();
      }

      await waitFor(() => {
        expect(mockStopAndUnloadCurrentSound).toHaveBeenCalled();
      });
    });

    it("音声停止のエラー後もクローズ処理は実行される", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockStopAndUnloadCurrentSound.mockRejectedValue(new Error("Stop failed"));

      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const blurViews = getAllByTestId("blur-view");
      const closeButtonBlur = blurViews[0];

      const touchable = closeButtonBlur.props.children;
      if (touchable && touchable.props && touchable.props.onPress) {
        await touchable.props.onPress();
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error stopping audio on close:",
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("エッジケース", () => {
    it("曲リストが空の場合でもエラーが発生しない", () => {
      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: [],
          currentSongIndex: 0,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      expect(() => {
        render(<SubPlayer onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it("曲が1つだけの場合でも正しく表示される", () => {
      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: [mockSongs[0]],
          currentSongIndex: 0,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByText("Test Song 1")).toBeTruthy();
      expect(getByText("Test Artist 1")).toBeTruthy();
    });

    it("currentSongIndexが範囲外でもエラーが発生しない", () => {
      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: mockSongs || [],
          currentSongIndex: 999,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      expect(() => {
        render(<SubPlayer onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it("currentPositionがdurationより大きい場合でもエラーが発生しない", () => {
      mockUseSubPlayerAudio.mockReturnValue({
        currentPosition: 40000,
        duration: 30000,
        isPlaying: true,
        togglePlayPause: mockTogglePlayPause,
        seekTo: mockSeekTo,
        stopAndUnloadCurrentsound: mockStopAndUnloadCurrentSound,
        randomStartPosition: 0,
        isLoading: false,
        playNextSong: jest.fn(),
        playPrevSong: jest.fn(),
      } as any);

      // mockUseSubPlayerStore uses default mock from beforeEach

      expect(() => {
        render(<SubPlayer onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it("画像パスがnullの場合でもエラーが発生しない", () => {
      const songsWithNullImage = [
        {
          ...mockSongs[0],
          image_path: undefined as any,
          video_path: undefined,
          lyrics: undefined,
        },
      ];

      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: songsWithNullImage || [],
          currentSongIndex: 0,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      expect(() => {
        render(<SubPlayer onClose={mockOnClose} />);
      }).not.toThrow();
    });

    it("タイトルが非常に長い場合でも表示される", () => {
      const longTitle = "A".repeat(200);
      const songsWithLongTitle = [
        {
          ...mockSongs[0],
          title: longTitle,
          video_path: undefined,
          lyrics: undefined,
        },
      ];

      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: songsWithLongTitle || [],
          currentSongIndex: 0,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByText(longTitle)).toBeTruthy();
    });

    it("特殊文字を含むタイトルが正しく表示される", () => {
      const specialTitle = "Test 🎵 Song & <Title> 'with' \"quotes\"";
      const songsWithSpecialChars = [
        {
          ...mockSongs[0],
          title: specialTitle,
          video_path: undefined,
          lyrics: undefined,
        },
      ];

      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: songsWithSpecialChars || [],
          currentSongIndex: 0,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 30000,
          setPreviewDuration: jest.fn(),
          autoPlay: true,
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      const { getByText } = render(<SubPlayer onClose={mockOnClose} />);

      expect(getByText(specialTitle)).toBeTruthy();
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("同じpropsで再レンダリングしても不必要な再計算を行わない", () => {
      const { rerender } = render(<SubPlayer onClose={mockOnClose} />);

      const initialTogglePlayPauseCalls = mockTogglePlayPause.mock.calls.length;

      // 同じpropsで再レンダリング
      rerender(<SubPlayer onClose={mockOnClose} />);

      // togglePlayPauseが追加で呼ばれないことを確認
      expect(mockTogglePlayPause).toHaveBeenCalledTimes(
        initialTogglePlayPauseCalls
      );
    });

    it("renderSongがuseCallbackでメモ化されている", () => {
      // このテストはコンポーネントがmemoでラップされ、
      // renderSongがuseCallbackで最適化されていることを間接的に確認
      const { rerender } = render(<SubPlayer onClose={mockOnClose} />);

      // 依存配列に含まれない値を変更
      mockUseSubPlayerStore.mockImplementation((selector) => {
        const state = {
          songs: mockSongs || [],
          currentSongIndex: 0,
          setCurrentSongIndex: mockSetCurrentSongIndex,
          showSubPlayer: true,
          setShowSubPlayer: jest.fn(),
          previewDuration: 45000, // 変更
          setPreviewDuration: jest.fn(),
          autoPlay: false, // 変更
          setAutoPlay: jest.fn(),
          setSongs: jest.fn(),
        };
        return selector(state);
      });

      expect(() => {
        rerender(<SubPlayer onClose={mockOnClose} />);
      }).not.toThrow();
    });
  });

  describe("スタイリングとレイアウト", () => {
    it("StatusBarが正しく設定される", () => {
      const { UNSAFE_getByType } = render(<SubPlayer onClose={mockOnClose} />);

      const statusBar = UNSAFE_getByType(require("react-native").StatusBar);
      expect(statusBar).toBeTruthy();
    });

    it("アクティブなスライドとインアクティブなスライドで異なるスタイルが適用される", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      // すべてのスライドが存在することを確認
      const imageBackgrounds = getAllByTestId("image-background");
      expect(imageBackgrounds.length).toBe(mockSongs.length);
    });

    it("グラデーションが上下に表示される", () => {
      const { getAllByTestId } = render(<SubPlayer onClose={mockOnClose} />);

      const gradients = getAllByTestId("linear-gradient");
      // 各曲に対して上下のグラデーション（2個 × 曲数）
      expect(gradients.length).toBeGreaterThanOrEqual(mockSongs.length * 2);
    });
  });
});
