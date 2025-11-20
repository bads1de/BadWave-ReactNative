/**
 * lib/mmkv-adapter.ts のテスト
 *
 * MMKVの同期APIをAsyncStorage互換の非同期インターフェースに変換する
 * アダプターの動作を検証します。
 */

import { mmkvAdapter } from "@/lib/mmkv-adapter";
import { storage } from "@/lib/mmkv-storage";

// MMKVストレージのモック化
jest.mock("@/lib/mmkv-storage", () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("mmkv-adapter", () => {
  // 各テスト前にモックをクリア
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getItem", () => {
    it("storage.getStringを呼び出してPromiseを返すこと", async () => {
      const mockValue = "test-value";
      (storage.getString as jest.Mock).mockReturnValue(mockValue);

      const result = await mmkvAdapter.getItem("test-key");

      expect(storage.getString).toHaveBeenCalledWith("test-key");
      expect(result).toBe(mockValue);
    });

    it("値が存在しない場合はnullを返すこと", async () => {
      (storage.getString as jest.Mock).mockReturnValue(undefined);

      const result = await mmkvAdapter.getItem("nonexistent-key");

      expect(storage.getString).toHaveBeenCalledWith("nonexistent-key");
      expect(result).toBeNull();
    });

    it("Promiseを返すこと", () => {
      (storage.getString as jest.Mock).mockReturnValue("value");

      const result = mmkvAdapter.getItem("test-key");

      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe("setItem", () => {
    it("storage.setを呼び出してPromiseを返すこと", async () => {
      await mmkvAdapter.setItem("test-key", "test-value");

      expect(storage.set).toHaveBeenCalledWith("test-key", "test-value");
    });

    it("Promiseを返すこと", () => {
      const result = mmkvAdapter.setItem("test-key", "test-value");

      expect(result).toBeInstanceOf(Promise);
    });

    it("正常に完了した場合はundefinedを返すこと", async () => {
      const result = await mmkvAdapter.setItem("test-key", "test-value");

      expect(result).toBeUndefined();
    });
  });

  describe("removeItem", () => {
    it("storage.deleteを呼び出してPromiseを返すこと", async () => {
      await mmkvAdapter.removeItem("test-key");

      expect(storage.delete).toHaveBeenCalledWith("test-key");
    });

    it("Promiseを返すこと", () => {
      const result = mmkvAdapter.removeItem("test-key");

      expect(result).toBeInstanceOf(Promise);
    });

    it("正常に完了した場合はundefinedを返すこと", async () => {
      const result = await mmkvAdapter.removeItem("test-key");

      expect(result).toBeUndefined();
    });
  });

  describe("AsyncStorage互換性", () => {
    it("getItem, setItem, removeItemメソッドを持つこと", () => {
      expect(mmkvAdapter.getItem).toBeDefined();
      expect(mmkvAdapter.setItem).toBeDefined();
      expect(mmkvAdapter.removeItem).toBeDefined();
    });

    it("すべてのメソッドが関数であること", () => {
      expect(typeof mmkvAdapter.getItem).toBe("function");
      expect(typeof mmkvAdapter.setItem).toBe("function");
      expect(typeof mmkvAdapter.removeItem).toBe("function");
    });
  });

  describe("統合シナリオ", () => {
    it("setItem → getItemのフローが正常に動作すること", async () => {
      const testKey = "integration-test-key";
      const testValue = "integration-test-value";

      // setItemを実行
      await mmkvAdapter.setItem(testKey, testValue);
      expect(storage.set).toHaveBeenCalledWith(testKey, testValue);

      // getItemを実行
      (storage.getString as jest.Mock).mockReturnValue(testValue);
      const result = await mmkvAdapter.getItem(testKey);
      expect(storage.getString).toHaveBeenCalledWith(testKey);
      expect(result).toBe(testValue);
    });

    it("setItem → removeItem → getItemのフローが正常に動作すること", async () => {
      const testKey = "integration-test-key-2";
      const testValue = "integration-test-value-2";

      // setItemを実行
      await mmkvAdapter.setItem(testKey, testValue);
      expect(storage.set).toHaveBeenCalledWith(testKey, testValue);

      // removeItemを実行
      await mmkvAdapter.removeItem(testKey);
      expect(storage.delete).toHaveBeenCalledWith(testKey);

      // getItemを実行（削除後なのでnullが返る）
      (storage.getString as jest.Mock).mockReturnValue(undefined);
      const result = await mmkvAdapter.getItem(testKey);
      expect(result).toBeNull();
    });
  });
});
