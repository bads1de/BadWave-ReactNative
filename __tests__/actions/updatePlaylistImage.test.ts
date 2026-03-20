import updatePlaylistImage from "@/actions/playlist/updatePlaylistImage";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/db/client", () => ({
  db: {
    update: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  playlists: {
    id: "id",
  },
}));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn((field, value) => ({ field, value })),
}));

// モックのエイリアス
const { mockFrom, mockSelect, mockUpdate, mockEq, mockSingle } = mockFunctions;
const { db } = require("@/lib/db/client");
const mockWhere = jest.fn();
const mockSet = jest.fn(() => ({ where: mockWhere }));

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  db.update.mockReturnValue({ set: mockSet });
  mockWhere.mockResolvedValue(undefined);
});

describe("updatePlaylistImage", () => {
  it("正常に画像を更新できる", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({
      data: { image_path: null },
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    // テスト実行
    await updatePlaylistImage("p1", "img.jpg");

    // 期待値を確認
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockSelect).toHaveBeenCalledWith("image_path");
    expect(mockEq).toHaveBeenCalledWith("id", "p1");
    expect(mockUpdate).toHaveBeenCalledWith({ image_path: "img.jpg" });
    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ imagePath: "img.jpg" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    await expect(updatePlaylistImage("p1", "img.jpg")).rejects.toThrow("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("既に画像が設定されている場合は更新しない", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({
      data: { image_path: "existing.jpg" },
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    // テスト実行
    await updatePlaylistImage("p1", "img.jpg");

    // 期待値を確認 - updateは呼ばれない
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockSelect).toHaveBeenCalledWith("image_path");
    expect(mockEq).toHaveBeenCalledWith("id", "p1");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});

