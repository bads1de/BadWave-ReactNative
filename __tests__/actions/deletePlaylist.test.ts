import deletePlaylist from "@/actions/playlist/deletePlaylist";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/db/client", () => ({
  db: {
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  playlists: {
    id: "id",
    userId: "userId",
  },
  playlistSongs: {
    playlistId: "playlistId",
  },
}));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn((field, value) => ({ field, value })),
  and: jest.fn((...conditions) => ({ conditions })),
}));

// モックのエイリアス
const { mockFrom, mockDelete, mockSelect, mockEq, mockSingle, mockThen } =
  mockFunctions;
const { db } = require("@/lib/db/client");
const mockWhere = jest.fn();

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  db.delete.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(undefined);
  // 所有権チェックは成功させる
  mockSingle.mockResolvedValue({ data: { id: "playlist123" }, error: null });
  // .eq().eq() チェーン + await(thenable) の両対応
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, then: mockThen });
  mockThen.mockImplementation((onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null }).then(onFulfilled)
  );
  mockSelect.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete });
});

describe("deletePlaylist", () => {
  const playlistId = "playlist123";
  const userId = "user456";

  it("正常にプレイリストと曲を削除できる", async () => {
    // テスト実行
    await deletePlaylist(playlistId, userId);

    // 期待値を確認
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("playlist_id", playlistId);
    expect(mockEq).toHaveBeenCalledWith("id", playlistId);
    expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    expect(db.delete).toHaveBeenCalledTimes(2);
    expect(mockWhere).toHaveBeenCalledTimes(2);
  });

  it("他人のプレイリストは削除せずエラーをスローする", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "0 rows" },
    });

    await expect(deletePlaylist(playlistId, "attacker")).rejects.toThrow();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("userIdがない場合はエラーをスローする", async () => {
    await expect(
      deletePlaylist(playlistId, undefined as unknown as string)
    ).rejects.toThrow("ユーザーIDが必要です");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("playlist_songs削除でエラーが発生した場合", async () => {
    // 所有権チェックは成功させ、直後のdeleteのawait値をエラーにする
    mockThen.mockImplementationOnce((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve({
        data: null,
        error: { message: "Delete song error" },
      }).then(onFulfilled)
    );

    // テスト実行と期待値を確認
    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete song error"
    );
    expect(db.delete).not.toHaveBeenCalled();
  });
});
