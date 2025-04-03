import { QueryPersistenceManager } from "@/lib/query-persistence-manager";
import { storage } from "@/lib/mmkv-storage";

jest.mock("@/lib/mmkv-storage", () => ({
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
      "CACHE_PREFIX:key",
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

    const gcTime = 1000 * 60 * 60; // 1時間
    jest
      .spyOn(require("@/constants"), "CACHE_CONFIG", "get")
      .mockReturnValue({ gcTime });
    jest
      .spyOn(require("@/constants"), "CACHE_PREFIX", "get")
      .mockReturnValue("CACHE_PREFIX");

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

    const gcTime = 1000 * 60 * 60; // 1時間
    jest
      .spyOn(require("@/constants"), "CACHE_CONFIG", "get")
      .mockReturnValue({ gcTime });
    jest
      .spyOn(require("@/constants"), "CACHE_PREFIX", "get")
      .mockReturnValue("CACHE_PREFIX");

    manager.loadCache("key");

    expect(storage.delete).toHaveBeenCalledWith("CACHE_PREFIX:key");
    expect(mockSetQueryData).not.toHaveBeenCalled();
  });

  it("removeCacheはstorage.deleteを呼ぶ", () => {
    jest
      .spyOn(require("@/constants"), "CACHE_PREFIX", "get")
      .mockReturnValue("CACHE_PREFIX");

    manager.removeCache("key");

    expect(storage.delete).toHaveBeenCalledWith("CACHE_PREFIX:key");
  });

  it("clearAllCacheはCACHE_PREFIX付きのキーを全削除", () => {
    (storage.getAllKeys as jest.Mock).mockReturnValue([
      "CACHE_PREFIX:key1",
      "CACHE_PREFIX:key2",
      "OTHER:key3",
    ]);
    jest
      .spyOn(require("@/constants"), "CACHE_PREFIX", "get")
      .mockReturnValue("CACHE_PREFIX");

    manager.clearAllCache();

    expect(storage.delete).toHaveBeenCalledWith("CACHE_PREFIX:key1");
    expect(storage.delete).toHaveBeenCalledWith("CACHE_PREFIX:key2");
    expect(storage.delete).not.toHaveBeenCalledWith("OTHER:key3");
  });
});
