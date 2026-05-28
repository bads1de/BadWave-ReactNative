import { mmkvSyncAdapter } from "@/lib/storage/mmkv-sync-adapter";
import { storage } from "@/lib/storage/mmkv-storage";

jest.mock("react-native-mmkv", () => ({
  MMKV: jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    getNumber: jest.fn(),
    getBoolean: jest.fn(),
    delete: jest.fn(),
    clearAll: jest.fn(),
    getAllKeys: jest.fn(() => []),
  })),
}));

describe("mmkvSyncAdapter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getItem", () => {
    it("should return value from storage", () => {
      (storage.getString as jest.Mock).mockReturnValue("test-value");

      const result = mmkvSyncAdapter.getItem("test-key");

      expect(storage.getString).toHaveBeenCalledWith("test-key");
      expect(result).toBe("test-value");
    });

    it("should return null when storage returns undefined", () => {
      (storage.getString as jest.Mock).mockReturnValue(undefined);

      const result = mmkvSyncAdapter.getItem("test-key");

      expect(result).toBeNull();
    });

    it("should return null when storage returns null", () => {
      (storage.getString as jest.Mock).mockReturnValue(null);

      const result = mmkvSyncAdapter.getItem("test-key");

      expect(result).toBeNull();
    });
  });

  describe("setItem", () => {
    it("should call storage.set with correct arguments", () => {
      mmkvSyncAdapter.setItem("test-key", "test-value");

      expect(storage.set).toHaveBeenCalledWith("test-key", "test-value");
    });
  });

  describe("removeItem", () => {
    it("should call storage.delete with correct key", () => {
      mmkvSyncAdapter.removeItem("test-key");

      expect(storage.delete).toHaveBeenCalledWith("test-key");
    });
  });
});
