import { QueryPersistenceManager } from "@/lib/storage/query-persistence-manager";
import { storage } from "@/lib/storage/mmkv-storage";

// 定数をモック
jest.mock("@/constants", () => ({
  CACHE_PREFIX: "@query-cache",
  CACHE_CONFIG: { gcTime: 1000 * 60 * 60 }, // 1時間
}));

jest.mock("@/lib/storage/mmkv-storage", () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getAllKeys: jest.fn(),
  },
}));

describe("QueryPersistenceManager", () => {
  const mockSetQueryData = jest.fn();
  const queryClient = { setQueryData: mockSetQueryData } as any;
  const manager = new QueryPersistenceManager(queryClient);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("saveCacheはstorage.setを呼ぶ", () => {
    const now = Date.now();
    Date.now = jest.fn(() => now);

    manager.saveCache("key", { foo: "bar" });

    expect(storage.set).toHaveBeenCalledWith(
      "@query-cache:key",
      JSON.stringify({ data: { foo: "bar" }, timestamp: now })
    );
  });

  it("loadCacheは期限内ならsetQueryDataを呼ぶ", () => {
    const now = Date.now();
    Date.now = jest.fn(() => now);

    const cache = {
      data: { foo: "bar" },
      timestamp: now - 1000,
    };
    (storage.getString as jest.Mock).mockReturnValue(JSON.stringify(cache));

    // 定数はモジュールモックで設定済み

    manager.loadCache("key");

    expect(mockSetQueryData).toHaveBeenCalledWith(["key"], { foo: "bar" });
  });

  it("loadCacheは期限切れならstorage.deleteを呼ぶ", () => {
    const now = Date.now();
    Date.now = jest.fn(() => now);

    const cache = {
      data: { foo: "bar" },
      timestamp: now - 1000 * 60 * 60 * 2, // 2時間前
    };
    (storage.getString as jest.Mock).mockReturnValue(JSON.stringify(cache));

    // 定数はモジュールモックで設定済み

    manager.loadCache("key");

    expect(storage.delete).toHaveBeenCalledWith("@query-cache:key");
    expect(mockSetQueryData).not.toHaveBeenCalled();
  });

  it("removeCacheはstorage.deleteを呼ぶ", () => {
    // 定数はモジュールモックで設定済み

    manager.removeCache("key");

    expect(storage.delete).toHaveBeenCalledWith("@query-cache:key");
  });

  it("clearAllCacheはCACHE_PREFIX付きのキーを全削除", () => {
    (storage.getAllKeys as jest.Mock).mockReturnValue([
      "@query-cache:key1",
      "@query-cache:key2",
      "OTHER:key3",
    ]);
    // 定数はモジュールモックで設定済み

    manager.clearAllCache();

    expect(storage.delete).toHaveBeenCalledWith("@query-cache:key1");
    expect(storage.delete).toHaveBeenCalledWith("@query-cache:key2");
    expect(storage.delete).not.toHaveBeenCalledWith("OTHER:key3");
  });
});
