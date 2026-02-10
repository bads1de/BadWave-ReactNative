import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import {
  useSearchHistoryStore,
  MAX_HISTORY_SIZE,
  SEARCH_HISTORY_STORAGE_KEY,
} from "@/hooks/stores/useSearchHistoryStore";
import { storage } from "@/lib/storage/mmkv-storage";

// react-native-mmkv のモック
jest.mock("@/lib/storage/mmkv-storage", () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedStorage = storage as jest.Mocked<typeof storage>;

describe("useSearchHistoryStore", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      useSearchHistoryStore.setState({ history: [] });
    });
    jest.clearAllMocks();
  });

  // ============================
  // 初期状態
  // ============================
  describe("初期状態", () => {
    it("履歴が空の配列で初期化される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());
      expect(result.current.history).toEqual([]);
    });
  });

  // ============================
  // addQuery
  // ============================
  describe("addQuery", () => {
    it("検索キーワードを履歴に追加できる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("test query");
      });

      expect(result.current.history).toEqual(["test query"]);
    });

    it("新しいキーワードが先頭に追加される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("first");
      });
      act(() => {
        result.current.addQuery("second");
      });

      expect(result.current.history).toEqual(["second", "first"]);
    });

    it("重複するキーワードは先頭に移動される（重複削除）", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("aaa");
      });
      act(() => {
        result.current.addQuery("bbb");
      });
      act(() => {
        result.current.addQuery("ccc");
      });
      act(() => {
        // 既存の "aaa" を再度追加 -> 先頭に移動
        result.current.addQuery("aaa");
      });

      expect(result.current.history).toEqual(["aaa", "ccc", "bbb"]);
    });

    it("空文字は追加されない", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("");
      });

      expect(result.current.history).toEqual([]);
    });

    it("空白のみの文字列は追加されない", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("   ");
      });

      expect(result.current.history).toEqual([]);
    });

    it("前後の空白はトリムされる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("  hello world  ");
      });

      expect(result.current.history).toEqual(["hello world"]);
    });

    it(`最大${MAX_HISTORY_SIZE}件を超えると古いものから削除される`, () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      // MAX_HISTORY_SIZE + 1 件追加
      act(() => {
        for (let i = 0; i < MAX_HISTORY_SIZE + 1; i++) {
          result.current.addQuery(`query_${i}`);
        }
      });

      expect(result.current.history).toHaveLength(MAX_HISTORY_SIZE);
      // 最新のものが先頭にある
      expect(result.current.history[0]).toBe(`query_${MAX_HISTORY_SIZE}`);
      // 最初に追加されたものは削除されている
      expect(result.current.history).not.toContain("query_0");
    });

    it("追加時にMMKVに永続化される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("persist me");
      });

      expect(mockedStorage.set).toHaveBeenCalledWith(
        SEARCH_HISTORY_STORAGE_KEY,
        JSON.stringify(["persist me"]),
      );
    });
  });

  // ============================
  // removeQuery
  // ============================
  describe("removeQuery", () => {
    it("指定したキーワードを履歴から削除できる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("aaa");
        result.current.addQuery("bbb");
        result.current.addQuery("ccc");
      });

      act(() => {
        result.current.removeQuery("bbb");
      });

      expect(result.current.history).toEqual(["ccc", "aaa"]);
    });

    it("存在しないキーワードを削除しても何も変わらない", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("aaa");
      });

      act(() => {
        result.current.removeQuery("not-exist");
      });

      expect(result.current.history).toEqual(["aaa"]);
    });

    it("削除時にMMKVに永続化される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("aaa");
        result.current.addQuery("bbb");
      });

      jest.clearAllMocks();

      act(() => {
        result.current.removeQuery("aaa");
      });

      expect(mockedStorage.set).toHaveBeenCalledWith(
        SEARCH_HISTORY_STORAGE_KEY,
        JSON.stringify(["bbb"]),
      );
    });
  });

  // ============================
  // clearHistory
  // ============================
  describe("clearHistory", () => {
    it("履歴を全て削除できる", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("aaa");
        result.current.addQuery("bbb");
      });

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toEqual([]);
    });

    it("全削除時にMMKVからキーが削除される", () => {
      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.addQuery("aaa");
      });

      jest.clearAllMocks();

      act(() => {
        result.current.clearHistory();
      });

      expect(mockedStorage.delete).toHaveBeenCalledWith(
        SEARCH_HISTORY_STORAGE_KEY,
      );
    });
  });

  // ============================
  // loadHistory (MMKV からの復元)
  // ============================
  describe("loadHistory", () => {
    it("MMKVから履歴を復元できる", () => {
      mockedStorage.getString.mockReturnValue(
        JSON.stringify(["saved1", "saved2"]),
      );

      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.loadHistory();
      });

      expect(result.current.history).toEqual(["saved1", "saved2"]);
      expect(mockedStorage.getString).toHaveBeenCalledWith(
        SEARCH_HISTORY_STORAGE_KEY,
      );
    });

    it("MMKVにデータがない場合は空配列のまま", () => {
      mockedStorage.getString.mockReturnValue(undefined);

      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.loadHistory();
      });

      expect(result.current.history).toEqual([]);
    });

    it("MMKVに無効なJSONがある場合は空配列にフォールバック", () => {
      mockedStorage.getString.mockReturnValue("invalid json{{{");

      const { result } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result.current.loadHistory();
      });

      expect(result.current.history).toEqual([]);
    });
  });

  // ============================
  // グローバル状態の共有
  // ============================
  describe("状態の共有", () => {
    it("複数のコンポーネントで状態が共有される", () => {
      const { result: result1 } = renderHook(() => useSearchHistoryStore());
      const { result: result2 } = renderHook(() => useSearchHistoryStore());

      act(() => {
        result1.current.addQuery("shared query");
      });

      expect(result1.current.history).toEqual(["shared query"]);
      expect(result2.current.history).toEqual(["shared query"]);
    });
  });
});
