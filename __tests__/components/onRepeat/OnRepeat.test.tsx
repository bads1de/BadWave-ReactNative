import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import OnRepeat from "@/components/onRepeat/OnRepeat";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/actions/getUser";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useOnRepeatStore } from "@/hooks/stores/useOnRepeatStore";
import TrackPlayer from "react-native-track-player";

// モックの設定
jest.mock("@tanstack/react-query");
jest.mock("@/actions/getUser");
jest.mock("@/hooks/useAudioPlayer");
jest.mock("@/hooks/stores/useOnRepeatStore");
jest.mock("react-native-track-player");
jest.mock("@/hooks/downloads/useDownloadedSongs", () => ({
  useDownloadedSongs: jest.fn(() => ({
    songs: [],
    isLoading: false,
    error: null,
    refresh: jest.fn(),
  })),
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("@/actions/getTopPlayedSongs", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<
  typeof useAudioPlayer
>;
const mockUseOnRepeatStore = useOnRepeatStore as jest.MockedFunction<
  typeof useOnRepeatStore
>;

describe("OnRepeat", () => {
  // テスト用のモックデータ
  const mockSongs = [
    {
      id: "song1",
      user_id: "user1",
      title: "トップソング1",
      author: "アーティスト1",
      image_path: "https://example.com/image1.jpg",
      song_path: "https://example.com/song1.mp3",
      count: "100",
      like_count: "50",
      created_at: "2024-01-01",
      play_count: 100,
    },
    {
      id: "song2",
      user_id: "user1",
      title: "トップソング2",
      author: "アーティスト2",
      image_path: "https://example.com/image2.jpg",
      song_path: "https://example.com/song2.mp3",
      count: "80",
      like_count: "40",
      created_at: "2024-01-02",
      play_count: 80,
    },
    {
      id: "song3",
      user_id: "user1",
      title: "トップソング3",
      author: "アーティスト3",
      image_path: "https://example.com/image3.jpg",
      song_path: "https://example.com/song3.mp3",
      count: "60",
      like_count: "30",
      created_at: "2024-01-03",
      play_count: 60,
    },
  ];

  const mockUser = {
    id: "user1",
    email: "test@example.com",
  };

  const mockOpenOnRepeatPlayer = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // デフォルトのモック設定
    mockUseUser.mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    } as any);

    mockUseQuery.mockReturnValue({
      data: mockSongs,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any);

    mockUseAudioPlayer.mockReturnValue({
      isPlaying: false,
      togglePlayPause: jest.fn(),
      currentSong: null,
    } as any);

    mockUseOnRepeatStore.mockImplementation((selector) => {
      const state = {
        isVisible: false,
        songs: [],
        currentIndex: 0,
        previewDuration: 15,
        open: mockOpenOnRepeatPlayer,
        close: jest.fn(),
        setCurrentIndex: jest.fn(),
        setPreviewDuration: jest.fn(),
      };
      return selector(state);
    });

    (TrackPlayer.pause as jest.Mock).mockResolvedValue(undefined);
  });

  describe("レンダリングテスト", () => {
    it("コンポーネントが正しくレンダリングされる", () => {
      const { getByText } = render(<OnRepeat />);

      expect(getByText("ON REPEAT")).toBeTruthy();
    });

    it("曲リストが正しく表示される", () => {
      const { getByText } = render(<OnRepeat />);

      expect(getByText("トップソング1")).toBeTruthy();
      expect(getByText("トップソング2")).toBeTruthy();
      expect(getByText("トップソング3")).toBeTruthy();
    });

    it("曲のアーティスト名が表示される", () => {
      const { getByText } = render(<OnRepeat />);

      expect(getByText("アーティスト1")).toBeTruthy();
      expect(getByText("アーティスト2")).toBeTruthy();
      expect(getByText("アーティスト3")).toBeTruthy();
    });
  });

  describe("ユーザーインタラクション", () => {
    it("曲をタップすると OnRepeat Player が開かれる", async () => {
      const { getByText } = render(<OnRepeat />);

      const song = getByText("トップソング1");
      fireEvent.press(song);

      await waitFor(() => {
        expect(mockOpenOnRepeatPlayer).toHaveBeenCalledWith(mockSongs, 0);
      });
    });

    it("2番目の曲をタップすると正しいインデックスで OnRepeat Player が開かれる", async () => {
      const { getByText } = render(<OnRepeat />);

      const song = getByText("トップソング2");
      fireEvent.press(song);

      await waitFor(() => {
        expect(mockOpenOnRepeatPlayer).toHaveBeenCalledWith(mockSongs, 1);
      });
    });

    it("3番目の曲をタップすると正しいインデックスで OnRepeat Player が開かれる", async () => {
      const { getByText } = render(<OnRepeat />);

      const song = getByText("トップソング3");
      fireEvent.press(song);

      await waitFor(() => {
        expect(mockOpenOnRepeatPlayer).toHaveBeenCalledWith(mockSongs, 2);
      });
    });

    it("再生中に別の曲をタップすると現在の再生が一時停止される", async () => {
      mockUseAudioPlayer.mockReturnValue({
        isPlaying: true,
        togglePlayPause: jest.fn(),
        currentSong: mockSongs[0],
      } as any);

      const { getByText } = render(<OnRepeat />);

      const song = getByText("トップソング2");
      fireEvent.press(song);

      await waitFor(() => {
        expect(TrackPlayer.pause).toHaveBeenCalled();
      });
    });
  });

  describe("状態管理", () => {
    it("空のリストの場合、何も表示されない", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { queryByText } = render(<OnRepeat />);

      expect(queryByText("ON REPEAT")).toBeNull();
    });

    it("ローディング状態の場合、空の状態で表示される", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { queryByText } = render(<OnRepeat />);

      expect(queryByText("ON REPEAT")).toBeNull();
    });

    it("ユーザーIDがない場合、クエリが無効化される", () => {
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<OnRepeat />);

      // useQueryが有効化されていないことを確認
      const queryCall = mockUseQuery.mock.calls[0][0] as any;
      expect(queryCall.enabled).toBe(false);
    });
  });

  describe("エラーハンドリング", () => {
    it("曲タップ時のエラーをキャッチして処理する", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      (TrackPlayer.pause as jest.Mock).mockRejectedValue(
        new Error("Pause failed")
      );

      mockUseAudioPlayer.mockReturnValue({
        isPlaying: true,
        togglePlayPause: jest.fn(),
        currentSong: mockSongs[0],
      } as any);

      const { getByText } = render(<OnRepeat />);

      const song = getByText("トップソング1");
      fireEvent.press(song);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });
});
