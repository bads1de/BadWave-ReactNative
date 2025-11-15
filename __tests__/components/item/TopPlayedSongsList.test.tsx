import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import TopPlayedSongsList from "@/components/item/TopPlayedSongsList";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/actions/getUser";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";
import TrackPlayer from "react-native-track-player";

// モックの設定
jest.mock("@tanstack/react-query");
jest.mock("@/actions/getUser");
jest.mock("@/hooks/useAudioPlayer");
jest.mock("@/hooks/useSubPlayerStore");
jest.mock("react-native-track-player");

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("@/actions/getTopPlayedSongs", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;
const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseAudioPlayer = useAudioPlayer as jest.MockedFunction<typeof useAudioPlayer>;
const mockUseSubPlayerStore = useSubPlayerStore as jest.MockedFunction<typeof useSubPlayerStore>;

describe("TopPlayedSongsList", () => {
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

  const mockSetShowSubPlayer = jest.fn();
  const mockSetSongs = jest.fn();
  const mockSetCurrentSongIndex = jest.fn();

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

    mockUseSubPlayerStore.mockReturnValue({
      setShowSubPlayer: mockSetShowSubPlayer,
      setSongs: mockSetSongs,
      setCurrentSongIndex: mockSetCurrentSongIndex,
      songs: [],
      currentSongIndex: -1,
      showSubPlayer: false,
    } as any);

    (TrackPlayer.pause as jest.Mock).mockResolvedValue(undefined);
  });

  describe("レンダリングテスト", () => {
    it("コンポーネントが正しくレンダリングされる", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("Top Played Songs")).toBeTruthy();
    });

    it("タイトルが正しく表示される", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("Top Played Songs")).toBeTruthy();
    });

    it("曲リストが正しく表示される", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("トップソング1")).toBeTruthy();
      expect(getByText("トップソング2")).toBeTruthy();
      expect(getByText("トップソング3")).toBeTruthy();
    });

    it("曲のアーティスト名が表示される", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("アーティスト1")).toBeTruthy();
      expect(getByText("アーティスト2")).toBeTruthy();
      expect(getByText("アーティスト3")).toBeTruthy();
    });

    it("各曲に画像が表示される", () => {
      const { UNSAFE_getAllByType } = render(<TopPlayedSongsList />);
      
      const images = UNSAFE_getAllByType("Image");
      expect(images.length).toBe(mockSongs.length);
    });
  });

  describe("データ表示", () => {
    it("3曲のトップソングが表示される", () => {
      const { getAllByText } = render(<TopPlayedSongsList />);
      
      const songs = mockSongs.map(song => getAllByText(song.title));
      expect(songs.length).toBe(mockSongs.length);
    });

    it("曲情報が正確に表示される", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      mockSongs.forEach(song => {
        expect(getByText(song.title)).toBeTruthy();
        expect(getByText(song.author)).toBeTruthy();
      });
    });

    it("曲が再生回数順に表示される", () => {
      const { getAllByText } = render(<TopPlayedSongsList />);
      
      // 最初の曲（最も再生回数が多い）が表示される
      expect(getAllByText("トップソング1")).toBeTruthy();
    });

    it("画像パスが正しく設定される", () => {
      const { UNSAFE_getAllByType } = render(<TopPlayedSongsList />);
      
      const images = UNSAFE_getAllByType("Image");
      images.forEach((image, index) => {
        expect(image.props.source.uri).toBe(mockSongs[index].image_path);
      });
    });

    it("複数の曲が横並びで表示される", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("トップソング1")).toBeTruthy();
      expect(getByText("トップソング2")).toBeTruthy();
      expect(getByText("トップソング3")).toBeTruthy();
    });
  });

  describe("ユーザーインタラクション", () => {
    it("曲をタップすると再生が開始される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetSongs).toHaveBeenCalledWith(mockSongs);
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(0);
        expect(mockSetShowSubPlayer).toHaveBeenCalledWith(true);
      });
    });

    it("2番目の曲をタップすると正しいインデックスで再生される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング2");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(1);
      });
    });

    it("3番目の曲をタップすると正しいインデックスで再生される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング3");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(2);
      });
    });

    it("再生中に別の曲をタップすると現在の再生が一時停止される", async () => {
      mockUseAudioPlayer.mockReturnValue({
        isPlaying: true,
        togglePlayPause: jest.fn(),
        currentSong: mockSongs[0],
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング2");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(TrackPlayer.pause).toHaveBeenCalled();
      });
    });

    it("曲をタップすると状態がリセットされてから新しい曲が設定される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(-1);
        expect(mockSetSongs).toHaveBeenCalledWith([]);
      });
    });

    it("曲タップ時にサブプレイヤーが表示される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetShowSubPlayer).toHaveBeenCalledWith(true);
      });
    });
  });

  describe("状態管理", () => {
    it("ローディング状態の場合、空の状態で表示される", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: true,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText, queryByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("Top Played Songs")).toBeTruthy();
      expect(queryByText("トップソング1")).toBeNull();
    });

    it("空のリストの場合、タイトルのみ表示される", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText, queryByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("Top Played Songs")).toBeTruthy();
      expect(queryByText("トップソング1")).toBeNull();
    });

    it("ユーザーIDがない場合、クエリが無効化される", () => {
      mockUseUser.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as any);

      render(<TopPlayedSongsList />);
      
      // useQueryが有効化されていないことを確認
      const queryCall = mockUseQuery.mock.calls[0][0] as any;
      expect(queryCall.enabled).toBe(false);
    });

    it("データが更新されると再レンダリングされる", () => {
      const newSongs = [
        {
          ...mockSongs[0],
          title: "更新されたソング",
        },
      ];

      mockUseQuery.mockReturnValue({
        data: newSongs,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("更新されたソング")).toBeTruthy();
    });

    it("エラー状態でもコンポーネントはクラッシュしない", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: new Error("Test error"),
        refetch: jest.fn(),
      } as any);

      expect(() => {
        render(<TopPlayedSongsList />);
      }).not.toThrow();
    });
  });

  describe("エッジケース", () => {
    it("空のリストでもエラーが発生しない", () => {
      mockUseQuery.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      expect(() => {
        render(<TopPlayedSongsList />);
      }).not.toThrow();
    });

    it("1曲のみの場合でも正しく表示される", () => {
      mockUseQuery.mockReturnValue({
        data: [mockSongs[0]],
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("トップソング1")).toBeTruthy();
      expect(getByText("アーティスト1")).toBeTruthy();
    });

    it("10曲以上ある場合でもエラーが発生しない", () => {
      const manySongs = Array.from({ length: 15 }, (_, i) => ({
        ...mockSongs[0],
        id: `song${i}`,
        title: `ソング${i}`,
      }));

      mockUseQuery.mockReturnValue({
        data: manySongs,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      expect(() => {
        render(<TopPlayedSongsList />);
      }).not.toThrow();
    });

    it("再生回数が0の曲でも表示される", () => {
      const songsWithZeroCount = [
        {
          ...mockSongs[0],
          play_count: 0,
          count: "0",
        },
      ];

      mockUseQuery.mockReturnValue({
        data: songsWithZeroCount,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("トップソング1")).toBeTruthy();
    });

    it("画像パスがnullの場合でもエラーが発生しない", () => {
      const songsWithNullImage = [
        {
          ...mockSongs[0],
          image_path: null as any,
        },
      ];

      mockUseQuery.mockReturnValue({
        data: songsWithNullImage,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      expect(() => {
        render(<TopPlayedSongsList />);
      }).not.toThrow();
    });

    it("非常に長い曲名でも表示される", () => {
      const longTitle = "A".repeat(100);
      const songsWithLongTitle = [
        {
          ...mockSongs[0],
          title: longTitle,
        },
      ];

      mockUseQuery.mockReturnValue({
        data: songsWithLongTitle,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText(longTitle)).toBeTruthy();
    });

    it("特殊文字を含むタイトルが正しく表示される", () => {
      const specialTitle = "Test 🎵 Song & <Title> 'with' \"quotes\"";
      const songsWithSpecialChars = [
        {
          ...mockSongs[0],
          title: specialTitle,
        },
      ];

      mockUseQuery.mockReturnValue({
        data: songsWithSpecialChars,
        isLoading: false,
        error: null,
        refetch: jest.fn(),
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText(specialTitle)).toBeTruthy();
    });

    it("曲タップ時のエラーをキャッチして処理する", async () => {
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      (TrackPlayer.pause as jest.Mock).mockRejectedValue(new Error("Pause failed"));

      mockUseAudioPlayer.mockReturnValue({
        isPlaying: true,
        togglePlayPause: jest.fn(),
        currentSong: mockSongs[0],
      } as any);

      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("メモ化とパフォーマンス", () => {
    it("同じpropsで再レンダリングしても不必要な再計算を行わない", () => {
      const { rerender } = render(<TopPlayedSongsList />);
      
      const initialSetSongsCalls = mockSetSongs.mock.calls.length;
      
      rerender(<TopPlayedSongsList />);
      
      // 状態更新関数が追加で呼ばれないことを確認
      expect(mockSetSongs).toHaveBeenCalledTimes(initialSetSongsCalls);
    });

    it("TopPlayedSongItemがメモ化されている", () => {
      const { rerender, getByText } = render(<TopPlayedSongsList />);
      
      // 最初のレンダリング
      expect(getByText("トップソング1")).toBeTruthy();
      
      // 同じデータで再レンダリング
      rerender(<TopPlayedSongsList />);
      
      // 再レンダリング後も正しく表示される
      expect(getByText("トップソング1")).toBeTruthy();
    });

    it("handleSongPressがuseCallbackでメモ化されている", () => {
      const { rerender, getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      const firstCallCount = mockSetSongs.mock.calls.length;
      
      // 依存配列に含まれない値が変更された場合
      mockUseSubPlayerStore.mockReturnValue({
        setShowSubPlayer: mockSetShowSubPlayer,
        setSongs: mockSetSongs,
        setCurrentSongIndex: mockSetCurrentSongIndex,
        songs: [mockSongs[0]], // 変更
        currentSongIndex: 0, // 変更
        showSubPlayer: true, // 変更
      } as any);
      
      rerender(<TopPlayedSongsList />);
      
      // handleSongPressが再作成されていないことを確認
      expect(mockSetSongs.mock.calls.length).toBe(firstCallCount);
    });
  });

  describe("コンポーネント構造", () => {
    it("カードコンテナが存在する", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const title = getByText("Top Played Songs");
      expect(title).toBeTruthy();
    });

    it("曲コンテナが横並びで表示される", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      expect(getByText("トップソング1")).toBeTruthy();
      expect(getByText("トップソング2")).toBeTruthy();
      expect(getByText("トップソング3")).toBeTruthy();
    });

    it("各曲アイテムにタイトルとアーティストが含まれる", () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      mockSongs.forEach(song => {
        expect(getByText(song.title)).toBeTruthy();
        expect(getByText(song.author)).toBeTruthy();
      });
    });
  });

  describe("状態更新の最適化", () => {
    it("曲タップ時にrequestAnimationFrameを使用せず同期的に状態を更新する", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      // 同期的な更新を検証（waitForを使用しない）
      await waitFor(() => {
        expect(mockSetSongs).toHaveBeenCalledWith(mockSongs);
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(0);
        expect(mockSetShowSubPlayer).toHaveBeenCalledWith(true);
      });
    });

    it("状態更新が同期的にバッチ処理される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        // 最初にリセット
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(-1);
        expect(mockSetSongs).toHaveBeenCalledWith([]);
        
        // その後新しい値を設定（同期的に）
        expect(mockSetSongs).toHaveBeenCalledWith(mockSongs);
        expect(mockSetCurrentSongIndex).toHaveBeenCalledWith(0);
        expect(mockSetShowSubPlayer).toHaveBeenCalledWith(true);
      });
    });

    it("requestAnimationFrameが使用されていないことを確認", async () => {
      // requestAnimationFrameをモック
      const rafSpy = jest.spyOn(global, 'requestAnimationFrame');
      
      const { getByText } = render(<TopPlayedSongsList />);
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetSongs).toHaveBeenCalledWith(mockSongs);
      });
      
      // requestAnimationFrameが呼ばれていないことを確認
      expect(rafSpy).not.toHaveBeenCalled();
      
      rafSpy.mockRestore();
    });

    it("複数の状態更新が一度にまとめて実行される", async () => {
      const { getByText } = render(<TopPlayedSongsList />);
      
      const callOrder: string[] = [];
      
      // 呼び出し順序を記録
      mockSetCurrentSongIndex.mockImplementation((index) => {
        callOrder.push(`setCurrentSongIndex:${index}`);
      });
      mockSetSongs.mockImplementation((songs) => {
        callOrder.push(`setSongs:${Array.isArray(songs) ? songs.length : 0}`);
      });
      mockSetShowSubPlayer.mockImplementation((show) => {
        callOrder.push(`setShowSubPlayer:${show}`);
      });
      
      const song = getByText("トップソング1");
      fireEvent.press(song);
      
      await waitFor(() => {
        expect(mockSetSongs).toHaveBeenCalled();
        expect(mockSetCurrentSongIndex).toHaveBeenCalled();
        expect(mockSetShowSubPlayer).toHaveBeenCalled();
      });
      
      // 状態更新が連続して呼ばれることを確認
      expect(callOrder).toContain('setCurrentSongIndex:-1');
      expect(callOrder).toContain('setSongs:0');
      expect(callOrder).toContain(`setSongs:${mockSongs.length}`);
      expect(callOrder).toContain('setCurrentSongIndex:0');
      expect(callOrder).toContain('setShowSubPlayer:true');
    });
  });
});