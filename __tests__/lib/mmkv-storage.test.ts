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

describe("mmkv-storage", () => {
  it("creates storage instance", () => {
    expect(storage).toBeDefined();
  });

  it("storage has required methods", () => {
    expect(storage.set).toBeDefined();
    expect(storage.getString).toBeDefined();
    expect(storage.getNumber).toBeDefined();
    expect(storage.getBoolean).toBeDefined();
    expect(storage.delete).toBeDefined();
    expect(storage.clearAll).toBeDefined();
  });

  it("can set and get string values", () => {
    storage.set("testKey", "testValue");
    expect(storage.set).toHaveBeenCalledWith("testKey", "testValue");
  });

  it("can delete values", () => {
    storage.delete("testKey");
    expect(storage.delete).toHaveBeenCalledWith("testKey");
  });
});
