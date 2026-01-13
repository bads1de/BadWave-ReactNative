import { renderHook, act } from "@testing-library/react";
import { useOnRepeatStore } from "@/hooks/stores/useOnRepeatStore";
import Song from "@/types";

describe("useOnRepeatStore", () => {
  // 各テスト前にストアをリセット
  beforeEach(() => {
    const { result } = renderHook(() => useOnRepeatStore());
    act(() => {
      result.current.close();
    });
  });

  const mockSongs: Song[] = [
    {
      id: "1",
      title: "Song 1",
      author: "Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "https://example.com/song1.mp3",
    },
    {
      id: "2",
      title: "Song 2",
      author: "Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "https://example.com/song2.mp3",
    },
    {
      id: "3",
      title: "Song 3",
      author: "Artist 3",
      image_path: "https://example.com/image3.jpg",
      song_path: "https://example.com/song3.mp3",
    },
  ];

  describe("初期状態", () => {
    it("isVisible は false であること", () => {
      const { result } = renderHook(() => useOnRepeatStore());
      expect(result.current.isVisible).toBe(false);
    });

    it("songs は空配列であること", () => {
      const { result } = renderHook(() => useOnRepeatStore());
      expect(result.current.songs).toEqual([]);
    });

    it("currentIndex は 0 であること", () => {
      const { result } = renderHook(() => useOnRepeatStore());
      expect(result.current.currentIndex).toBe(0);
    });

    it("previewDuration のデフォルト値は 15 秒であること", () => {
      const { result } = renderHook(() => useOnRepeatStore());
      expect(result.current.previewDuration).toBe(15);
    });
  });

  describe("open アクション", () => {
    it("songs, currentIndex, isVisible を一度に設定できること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.open(mockSongs, 1);
      });

      expect(result.current.isVisible).toBe(true);
      expect(result.current.songs).toEqual(mockSongs);
      expect(result.current.currentIndex).toBe(1);
    });

    it("2曲目のインデックス(1)を指定して開いた場合、currentIndex は 1 であること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.open(mockSongs, 1);
      });

      expect(result.current.currentIndex).toBe(1);
    });

    it("3曲目のインデックス(2)を指定して開いた場合、currentIndex は 2 であること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.open(mockSongs, 2);
      });

      expect(result.current.currentIndex).toBe(2);
    });
  });

  describe("close アクション", () => {
    it("isVisible を false に設定すること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      // まず開く
      act(() => {
        result.current.open(mockSongs, 0);
      });
      expect(result.current.isVisible).toBe(true);

      // 閉じる
      act(() => {
        result.current.close();
      });
      expect(result.current.isVisible).toBe(false);
    });

    it("songs をクリアすること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.open(mockSongs, 0);
      });
      expect(result.current.songs.length).toBe(3);

      act(() => {
        result.current.close();
      });
      expect(result.current.songs).toEqual([]);
    });

    it("currentIndex を 0 にリセットすること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.open(mockSongs, 2);
      });
      expect(result.current.currentIndex).toBe(2);

      act(() => {
        result.current.close();
      });
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe("setCurrentIndex アクション", () => {
    it("currentIndex を更新できること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.open(mockSongs, 0);
      });

      act(() => {
        result.current.setCurrentIndex(2);
      });

      expect(result.current.currentIndex).toBe(2);
    });
  });

  describe("setPreviewDuration アクション", () => {
    it("previewDuration を更新できること", () => {
      const { result } = renderHook(() => useOnRepeatStore());

      act(() => {
        result.current.setPreviewDuration(30);
      });

      expect(result.current.previewDuration).toBe(30);
    });
  });
});
