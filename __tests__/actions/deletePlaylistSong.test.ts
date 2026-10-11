import deletePlaylistSong from "@/actions/playlist/deletePlaylistSong";
import { mockFunctions } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/db/client", () => ({
  db: {
    delete: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  playlistSongs: {
    playlistId: "playlistId",
    songId: "songId",
  },
}));
jest.mock("drizzle-orm", () => ({
  and: jest.fn((...conditions) => conditions),
  eq: jest.fn((field, value) => ({ field, value })),
}));

const { mockFrom, mockDelete, mockSelect, mockEq, mockSingle, mockThen } =
  mockFunctions;
const { db } = require("@/lib/db/client");
const mockWhere = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockSingle.mockResolvedValue({ data: { id: "playlist123" }, error: null });
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, then: mockThen });
  mockThen.mockImplementation((onFulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data: null, error: null }).then(onFulfilled)
  );
  mockSelect.mockReturnValue({ eq: mockEq });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ select: mockSelect, delete: mockDelete });
  db.delete.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(undefined);
});

describe("deletePlaylistSong", () => {
  const playlistId = "playlist123";
  const songId = "song456";
  const userId = "user123";

  it("正常に曲を削除できる", async () => {
    await deletePlaylistSong(playlistId, songId, userId);

    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    expect(db.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("他人のプレイリストの曲は削除せずエラーをスローする", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "0 rows" },
    });

    await expect(
      deletePlaylistSong(playlistId, songId, "attacker")
    ).rejects.toThrow();
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("userIdがない場合はエラーをスローする", async () => {
    await expect(
      deletePlaylistSong(playlistId, songId, undefined as unknown as string)
    ).rejects.toThrow("ユーザーIDが必要です");
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("削除時にエラーが発生した場合", async () => {
    mockThen.mockImplementationOnce((onFulfilled: (v: unknown) => unknown) =>
      Promise.resolve({
        data: null,
        error: { message: "Delete error" },
      }).then(onFulfilled)
    );

    await expect(deletePlaylistSong(playlistId, songId, userId)).rejects.toThrow(
      "Delete error"
    );
    expect(db.delete).not.toHaveBeenCalled();
  });
});
