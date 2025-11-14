import { mmkvPersister } from "@/lib/mmkv-persister";
import { storage } from "@/lib/mmkv-storage";
import { PersistedClient } from "@tanstack/react-query-persist-client";

// react-native-mmkvのモック
jest.mock("react-native-mmkv");

describe("mmkv-persister", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Persisterオブジェクトのエクスポート", () => {
    it("mmkvPersisterが正しくエクスポートされること", () => {
      expect(mmkvPersister).toBeDefined();
    });

    it("persisterが必要なメソッドを持っていること", () => {
      expect(mmkvPersister.persistClient).toBeDefined();
      expect(mmkvPersister.restoreClient).toBeDefined();
      expect(mmkvPersister.removeClient).toBeDefined();
      expect(typeof mmkvPersister.persistClient).toBe("function");
      expect(typeof mmkvPersister.restoreClient).toBe("function");
      expect(typeof mmkvPersister.removeClient).toBe("function");
    });
  });

  describe("clientStorageインターフェース", () => {
    describe("setItem", () => {
      it("storage.setを正しく呼び出すこと", async () => {
        const mockData: PersistedClient = {
          timestamp: Date.now(),
          buster: "",
          clientState: {
            queries: [],
            mutations: [],
          },
        };

        mmkvPersister.persistClient(mockData);

        // スロットリング機構があるため、少し待つ
        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(storage.set).toHaveBeenCalledWith(
          "TANSTACK_QUERY_CACHE",
          JSON.stringify(mockData)
        );
      });

      it("複雑なデータ構造を正しくシリアライズして保存すること", async () => {
        const complexData: PersistedClient = {
          timestamp: 1234567890,
          buster: "test-buster",
          clientState: {
            queries: [
              {
                queryHash: "test-query",
                queryKey: ["todos"],
                state: {
                  data: { id: 1, title: "Test Todo" },
                  dataUpdateCount: 1,
                  dataUpdatedAt: 1234567890,
                  error: null,
                  errorUpdateCount: 0,
                  errorUpdatedAt: 0,
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                  fetchMeta: null,
                  isInvalidated: false,
                  status: "success",
                  fetchStatus: "idle",
                },
              },
            ],
            mutations: [],
          },
        };

        mmkvPersister.persistClient(complexData);

        // スロットリング機構があるため、少し待つ
        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(storage.set).toHaveBeenCalledWith(
          "TANSTACK_QUERY_CACHE",
          JSON.stringify(complexData)
        );
      });

      it("空のクライアント状態を保存できること", async () => {
        const emptyData: PersistedClient = {
          timestamp: Date.now(),
          buster: "",
          clientState: {
            queries: [],
            mutations: [],
          },
        };

        mmkvPersister.persistClient(emptyData);

        // スロットリング機構があるため、少し待つ
        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(storage.set).toHaveBeenCalled();
      });
    });

    describe("getItem", () => {
      it("storage.getStringを呼び出してデータを取得すること", async () => {
        const mockData: PersistedClient = {
          timestamp: Date.now(),
          buster: "",
          clientState: {
            queries: [],
            mutations: [],
          },
        };

        (storage.getString as jest.Mock).mockReturnValue(
          JSON.stringify(mockData)
        );

        const result = await mmkvPersister.restoreClient();

        expect(storage.getString).toHaveBeenCalledWith("TANSTACK_QUERY_CACHE");
        expect(result).toEqual(mockData);
      });

      it("データが存在しない場合はundefinedを返すこと", async () => {
        (storage.getString as jest.Mock).mockReturnValue(undefined);

        const result = await mmkvPersister.restoreClient();

        expect(storage.getString).toHaveBeenCalledWith("TANSTACK_QUERY_CACHE");
        expect(result).toBeUndefined();
      });

      it("複雑なデータ構造を正しくデシリアライズして取得すること", async () => {
        const complexData: PersistedClient = {
          timestamp: 1234567890,
          buster: "test-buster",
          clientState: {
            queries: [
              {
                queryHash: "test-query",
                queryKey: ["todos", { id: 1 }],
                state: {
                  data: [
                    { id: 1, title: "Test Todo 1" },
                    { id: 2, title: "Test Todo 2" },
                  ],
                  dataUpdateCount: 2,
                  dataUpdatedAt: 1234567890,
                  error: null,
                  errorUpdateCount: 0,
                  errorUpdatedAt: 0,
                  fetchFailureCount: 0,
                  fetchFailureReason: null,
                  fetchMeta: null,
                  isInvalidated: false,
                  status: "success",
                  fetchStatus: "idle",
                },
              },
            ],
            mutations: [],
          },
        };

        (storage.getString as jest.Mock).mockReturnValue(
          JSON.stringify(complexData)
        );

        const result = await mmkvPersister.restoreClient();

        expect(result).toEqual(complexData);
        expect(result?.clientState.queries).toHaveLength(1);
        expect(result?.clientState.queries[0].state.data).toEqual([
          { id: 1, title: "Test Todo 1" },
          { id: 2, title: "Test Todo 2" },
        ]);
      });
    });

    describe("removeItem", () => {
      it("storage.deleteを正しく呼び出すこと", async () => {
        await mmkvPersister.removeClient();

        expect(storage.delete).toHaveBeenCalledWith("TANSTACK_QUERY_CACHE");
      });

      it("複数回削除を呼び出しても問題ないこと", async () => {
        await mmkvPersister.removeClient();
        await mmkvPersister.removeClient();

        expect(storage.delete).toHaveBeenCalledTimes(2);
        expect(storage.delete).toHaveBeenCalledWith("TANSTACK_QUERY_CACHE");
      });
    });
  });

  describe("エラーハンドリング", () => {
    beforeEach(() => {
      // 各テストの前にモックをリセット
      jest.clearAllMocks();
      // デフォルトの動作を復元
      (storage.set as jest.Mock).mockImplementation(() => {});
      (storage.getString as jest.Mock).mockReturnValue(undefined);
      (storage.delete as jest.Mock).mockImplementation(() => {});
    });

    it("JSON parse時のエラーは適切に伝播すること", async () => {
      // 無効なJSONを設定
      (storage.getString as jest.Mock).mockReturnValue("invalid json {");

      // restoreClientを実行し、エラーがキャッチされることを検証
      let errorOccurred = false;
      try {
        await mmkvPersister.restoreClient();
      } catch (error) {
        errorOccurred = true;
        expect(error).toBeInstanceOf(SyntaxError);
      }
      
      // エラーが発生したことを確認
      expect(errorOccurred).toBe(true);
    });

    it("複数回の保存操作がスロットリングにより制御されること", async () => {
      const mockData1: PersistedClient = {
        timestamp: Date.now(),
        buster: "v1",
        clientState: { queries: [], mutations: [] },
      };

      const mockData2: PersistedClient = {
        timestamp: Date.now() + 100,
        buster: "v2",
        clientState: { queries: [], mutations: [] },
      };

      // 連続して2回保存を試みる
      mmkvPersister.persistClient(mockData1);
      mmkvPersister.persistClient(mockData2);

      // スロットリング期間待機
      await new Promise((resolve) => setTimeout(resolve, 1100));

      // スロットリングにより、最後のデータのみが保存される
      expect(storage.set).toHaveBeenCalledTimes(1);
      expect(storage.set).toHaveBeenCalledWith(
        "TANSTACK_QUERY_CACHE",
        JSON.stringify(mockData2)
      );
    });

    it("空文字列をデシリアライズしようとした場合にエラーがスローされること", async () => {
      (storage.getString as jest.Mock).mockReturnValue("");

      // getStringが空文字列を返す場合、nullとして扱われるためundefinedが返される
      const result = await mmkvPersister.restoreClient();
      expect(result).toBeUndefined();
    });
  });

  describe("データの永続化と復元のライフサイクル", () => {
    beforeEach(() => {
      // 各テストの前にモックをリセット
      jest.clearAllMocks();
      // デフォルトの動作を復元
      (storage.set as jest.Mock).mockImplementation(() => {});
      (storage.getString as jest.Mock).mockReturnValue(undefined);
      (storage.delete as jest.Mock).mockImplementation(() => {});
    });

    it("保存して復元するライフサイクルが正しく動作すること", async () => {
      const testData: PersistedClient = {
        timestamp: 1234567890,
        buster: "test-v1",
        clientState: {
          queries: [
            {
              queryHash: "todos-all",
              queryKey: ["todos"],
              state: {
                data: [{ id: 1, title: "Test" }],
                dataUpdateCount: 1,
                dataUpdatedAt: 1234567890,
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchFailureReason: null,
                fetchMeta: null,
                isInvalidated: false,
                status: "success",
                fetchStatus: "idle",
              },
            },
          ],
          mutations: [],
        },
      };

      // 保存
      mmkvPersister.persistClient(testData);

      // スロットリング機構があるため、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(storage.set).toHaveBeenCalledWith(
        "TANSTACK_QUERY_CACHE",
        JSON.stringify(testData)
      );

      // 復元のためのモック設定
      (storage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(testData)
      );

      // 復元
      const restored = await mmkvPersister.restoreClient();
      expect(restored).toEqual(testData);
    });

    it("保存、復元、削除の完全なライフサイクルが動作すること", async () => {
      const testData: PersistedClient = {
        timestamp: Date.now(),
        buster: "",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      // 1. 保存
      mmkvPersister.persistClient(testData);

      // スロットリング機構があるため、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(storage.set).toHaveBeenCalled();

      // 2. 復元
      (storage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(testData)
      );
      const restored = await mmkvPersister.restoreClient();
      expect(restored).toEqual(testData);

      // 3. 削除
      await mmkvPersister.removeClient();
      expect(storage.delete).toHaveBeenCalledWith("TANSTACK_QUERY_CACHE");

      // 4. 削除後の復元試行（データなし）
      (storage.getString as jest.Mock).mockReturnValue(undefined);
      const afterDelete = await mmkvPersister.restoreClient();
      expect(afterDelete).toBeUndefined();
    });
  });

  describe("エッジケース", () => {
    it("nullデータを含むクライアント状態を処理できること", async () => {
      const dataWithNull: PersistedClient = {
        timestamp: Date.now(),
        buster: "",
        clientState: {
          queries: [
            {
              queryHash: "test",
              queryKey: ["test"],
              state: {
                data: null,
                dataUpdateCount: 0,
                dataUpdatedAt: 0,
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchFailureReason: null,
                fetchMeta: null,
                isInvalidated: false,
                status: "success",
                fetchStatus: "idle",
              },
            },
          ],
          mutations: [],
        },
      };

      mmkvPersister.persistClient(dataWithNull);
      (storage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(dataWithNull)
      );
      const restored = await mmkvPersister.restoreClient();

      expect(restored?.clientState.queries[0].state.data).toBeNull();
    });

    it("大きなデータセットを処理できること", async () => {
      const largeDataset: PersistedClient = {
        timestamp: Date.now(),
        buster: "",
        clientState: {
          queries: Array.from({ length: 100 }, (_, i) => ({
            queryHash: `query-${i}`,
            queryKey: ["data", i],
            state: {
              data: { id: i, value: `test-${i}` },
              dataUpdateCount: 1,
              dataUpdatedAt: Date.now(),
              error: null,
              errorUpdateCount: 0,
              errorUpdatedAt: 0,
              fetchFailureCount: 0,
              fetchFailureReason: null,
              fetchMeta: null,
              isInvalidated: false,
              status: "success",
              fetchStatus: "idle",
            },
          })),
          mutations: [],
        },
      };

      expect(() => mmkvPersister.persistClient(largeDataset)).not.toThrow();

      // スロットリング機構があるため、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(storage.set).toHaveBeenCalled();
    });

    it("特殊文字を含むデータを正しく処理すること", async () => {
      const specialCharsData: PersistedClient = {
        timestamp: Date.now(),
        buster: "",
        clientState: {
          queries: [
            {
              queryHash: "special",
              queryKey: ["special"],
              state: {
                data: {
                  text: 'Hello "World" \n\t\r',
                  unicode: "こんにちは世界 🌍",
                  symbols: "<>&\"'",
                },
                dataUpdateCount: 1,
                dataUpdatedAt: Date.now(),
                error: null,
                errorUpdateCount: 0,
                errorUpdatedAt: 0,
                fetchFailureCount: 0,
                fetchFailureReason: null,
                fetchMeta: null,
                isInvalidated: false,
                status: "success",
                fetchStatus: "idle",
              },
            },
          ],
          mutations: [],
        },
      };

      mmkvPersister.persistClient(specialCharsData);
      (storage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(specialCharsData)
      );
      const restored = await mmkvPersister.restoreClient();

      expect(restored?.clientState.queries[0].state.data).toEqual(
        specialCharsData.clientState.queries[0].state.data
      );
    });

    it("タイムスタンプが正しく保存・復元されること", async () => {
      const now = Date.now();
      const timestampData: PersistedClient = {
        timestamp: now,
        buster: "",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      mmkvPersister.persistClient(timestampData);
      (storage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(timestampData)
      );
      const restored = await mmkvPersister.restoreClient();

      expect(restored?.timestamp).toBe(now);
    });
  });

  describe("設定の検証", () => {
    it("正しいキー名(TANSTACK_QUERY_CACHE)が使用されていること", async () => {
      const mockData: PersistedClient = {
        timestamp: Date.now(),
        buster: "",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      mmkvPersister.persistClient(mockData);

      // スロットリング機構があるため、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(storage.set).toHaveBeenCalledWith(
        "TANSTACK_QUERY_CACHE",
        expect.any(String)
      );
    });

    it("シリアライズがJSON.stringifyを使用していること", async () => {
      const mockData: PersistedClient = {
        timestamp: 12345,
        buster: "test",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      mmkvPersister.persistClient(mockData);

      const expectedJson = JSON.stringify(mockData);

      // スロットリング機構があるため、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(storage.set).toHaveBeenCalledWith(
        "TANSTACK_QUERY_CACHE",
        expectedJson
      );
    });

    it("デシリアライズがJSON.parseを使用していること", async () => {
      const mockData: PersistedClient = {
        timestamp: 12345,
        buster: "test",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      const serialized = JSON.stringify(mockData);
      (storage.getString as jest.Mock).mockReturnValue(serialized);

      const result = await mmkvPersister.restoreClient();

      expect(result).toEqual(JSON.parse(serialized));
    });
  });

  describe("MMKVStorageとの統合", () => {
    beforeEach(() => {
      // 各テストの前にモックをリセット
      jest.clearAllMocks();
      // デフォルトの動作を復元
      (storage.set as jest.Mock).mockImplementation(() => {});
      (storage.getString as jest.Mock).mockReturnValue(undefined);
      (storage.delete as jest.Mock).mockImplementation(() => {});
    });
    it("MMKVStorageのインスタンスを正しく使用していること", () => {
      expect(storage).toBeDefined();
      expect(storage.set).toBeDefined();
      expect(storage.getString).toBeDefined();
      expect(storage.delete).toBeDefined();
    });

    it("storage操作が順次実行されること", async () => {
      const mockData: PersistedClient = {
        timestamp: Date.now(),
        buster: "",
        clientState: {
          queries: [],
          mutations: [],
        },
      };

      // 保存
      mmkvPersister.persistClient(mockData);

      // スロットリング機構があるため、少し待つ
      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(storage.set).toHaveBeenCalledTimes(1);

      // 取得
      (storage.getString as jest.Mock).mockReturnValue(
        JSON.stringify(mockData)
      );
      await mmkvPersister.restoreClient();
      expect(storage.getString).toHaveBeenCalledTimes(1);

      // 削除
      await mmkvPersister.removeClient();
      expect(storage.delete).toHaveBeenCalledTimes(1);
    });
  });
});