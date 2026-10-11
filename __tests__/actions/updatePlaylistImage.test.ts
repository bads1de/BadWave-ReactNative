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
  and: jest.fn((...conditions) => ({ conditions })),
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
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockUpdate.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    // テスト実行
    await updatePlaylistImage("p1", "img.jpg", "u1");

    // 期待値を確認
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockSelect).toHaveBeenCalledWith("image_path");
    expect(mockEq).toHaveBeenCalledWith("id", "p1");
    expect(mockEq).toHaveBeenCalledWith("user_id", "u1");
    expect(mockUpdate).toHaveBeenCalledWith({ image_path: "img.jpg" });
    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ imagePath: "img.jpg" });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("userIdがない場合はエラーをスローする", async () => {
    await expect(
      updatePlaylistImage("p1", "img.jpg", undefined as unknown as string)
    ).rejects.toThrow("ユーザーIDが必要です");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("他人のプレイリストの場合は更新せずエラーをスローする", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "0 rows" },
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    await expect(updatePlaylistImage("p1", "img.jpg", "attacker")).rejects.toThrow();
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    await expect(updatePlaylistImage("p1", "img.jpg", "u1")).rejects.toThrow("error");
    expect(db.update).not.toHaveBeenCalled();
  });

  it("既に画像が設定されている場合は更新しない", async () => {
    // モックの設定
    mockSingle.mockResolvedValueOnce({
      data: { image_path: "existing.jpg" },
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEq, single: mockSingle });
    mockFrom.mockReturnValue({ select: mockSelect, update: mockUpdate });

    // テスト実行
    await updatePlaylistImage("p1", "img.jpg", "u1");

    // 期待値を確認 - updateは呼ばれない
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockSelect).toHaveBeenCalledWith("image_path");
    expect(mockEq).toHaveBeenCalledWith("id", "p1");
    expect(mockEq).toHaveBeenCalledWith("user_id", "u1");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
  });
});

