import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { useSubPlayerStore } from "@/hooks/stores/useSubPlayerStore";

describe("useSubPlayerStore", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      useSubPlayerStore.setState({
        showSubPlayer: false,
        currentSongIndex: 0,
        songs: [],
        previewDuration: 15,
        autoPlay: true,
      });
    });
  });

  it("初期状態が正しく設定されている", () => {
    const { result } = renderHook(() => useSubPlayerStore());

    expect(result.current.showSubPlayer).toBe(false);
    expect(result.current.currentSongIndex).toBe(0);
    expect(result.current.songs).toEqual([]);
    expect(result.current.previewDuration).toBe(15);
    expect(result.current.autoPlay).toBe(true);
  });

  it("setShowSubPlayerでサブプレイヤーの表示状態を変更できる", () => {
    const { result } = renderHook(() => useSubPlayerStore());

    act(() => {
      result.current.setShowSubPlayer(true);
    });

    expect(result.current.showSubPlayer).toBe(true);
  });

  it("setCurrentSongIndexで現在の曲インデックスを変更できる", () => {
    const { result } = renderHook(() => useSubPlayerStore());

    act(() => {
      result.current.setCurrentSongIndex(2);
    });

    expect(result.current.currentSongIndex).toBe(2);
  });

  it("setSongsで曲リストを設定できる", () => {
    const { result } = renderHook(() => useSubPlayerStore());

    const mockSongs = [
      {
        id: "song1",
        title: "テスト曲1",
        author: "テストアーティスト1",
        image_path: "https://example.com/image1.jpg",
        song_path: "https://example.com/song1.mp3",
      },
      {
        id: "song2",
        title: "テスト曲2",
        author: "テストアーティスト2",
        image_path: "https://example.com/image2.jpg",
        song_path: "https://example.com/song2.mp3",
      },
    ];

    act(() => {
      result.current.setSongs(mockSongs);
    });

    expect(result.current.songs).toEqual(mockSongs);
  });

  it("setPreviewDurationでプレビュー再生時間を変更できる", () => {
    const { result } = renderHook(() => useSubPlayerStore());

    act(() => {
      result.current.setPreviewDuration(30);
    });

    expect(result.current.previewDuration).toBe(30);
  });

  it("setAutoPlayで自動再生設定を変更できる", () => {
    const { result } = renderHook(() => useSubPlayerStore());

    act(() => {
      result.current.setAutoPlay(false);
    });

    expect(result.current.autoPlay).toBe(false);
  });

  it("複数のコンポーネントで状態が共有される", () => {
    const { result: result1 } = renderHook(() => useSubPlayerStore());
    const { result: result2 } = renderHook(() => useSubPlayerStore());

    act(() => {
      result1.current.setShowSubPlayer(true);
    });

    expect(result1.current.showSubPlayer).toBe(true);
    expect(result2.current.showSubPlayer).toBe(true);
  });
});

