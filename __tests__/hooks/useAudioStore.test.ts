import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { useAudioStore, useAudioActions } from "@/hooks/useAudioStore";
import { RepeatMode } from "react-native-track-player";

// react-native-track-playerのモック
jest.mock("react-native-track-player", () => ({
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
}));

describe("useAudioStore", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      useAudioStore.setState({
        currentSong: null,
        repeatMode: RepeatMode.Off,
        shuffle: false,
      });
    });
  });

  it("初期状態が正しく設定されている", () => {
    const { result } = renderHook(() => useAudioStore());

    expect(result.current.currentSong).toBeNull();
    expect(result.current.repeatMode).toBe(RepeatMode.Off);
    expect(result.current.shuffle).toBe(false);
  });

  it("setCurrentSongで現在の曲を設定できる", () => {
    const { result } = renderHook(() => useAudioStore());

    const mockSong = {
      id: "song1",
      title: "テスト曲",
      author: "テストアーティスト",
      image_path: "https://example.com/image.jpg",
      song_path: "https://example.com/song.mp3",
    };

    act(() => {
      result.current.setCurrentSong(mockSong);
    });

    expect(result.current.currentSong).toEqual(mockSong);
  });

  it("setRepeatModeでリピートモードを設定できる", () => {
    const { result } = renderHook(() => useAudioStore());

    act(() => {
      result.current.setRepeatMode(RepeatMode.Track);
    });

    expect(result.current.repeatMode).toBe(RepeatMode.Track);
  });

  it("setShuffleでシャッフルモードを設定できる", () => {
    const { result } = renderHook(() => useAudioStore());

    act(() => {
      result.current.setShuffle(true);
    });

    expect(result.current.shuffle).toBe(true);
  });

  it("複数のコンポーネントで状態が共有される", () => {
    const { result: result1 } = renderHook(() => useAudioStore());
    const { result: result2 } = renderHook(() => useAudioStore());

    const mockSong = {
      id: "song1",
      title: "テスト曲",
      author: "テストアーティスト",
      image_path: "https://example.com/image.jpg",
      song_path: "https://example.com/song.mp3",
    };

    act(() => {
      result1.current.setCurrentSong(mockSong);
    });

    expect(result1.current.currentSong).toEqual(mockSong);
    expect(result2.current.currentSong).toEqual(mockSong);
  });
});

describe("useAudioActions", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      useAudioStore.setState({
        currentSong: null,
        repeatMode: RepeatMode.Off,
        shuffle: false,
      });
    });
  });

  it("updateCurrentSongAndStateで曲を更新できる", () => {
    const { result } = renderHook(() => useAudioActions());
    const storeHook = renderHook(() => useAudioStore());

    const mockSong = {
      id: "song1",
      title: "テスト曲",
      author: "テストアーティスト",
      image_path: "https://example.com/image.jpg",
      song_path: "https://example.com/song.mp3",
    };

    act(() => {
      result.current.updateCurrentSongAndState(mockSong);
    });

    expect(storeHook.result.current.currentSong).toEqual(mockSong);
  });
});
