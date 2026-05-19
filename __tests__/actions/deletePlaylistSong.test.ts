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

const { mockFrom, mockDelete, mockEq } = mockFunctions;
const { db } = require("@/lib/db/client");
const mockWhere = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ delete: mockDelete });
  db.delete.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(undefined);
});

describe("deletePlaylistSong", () => {
  const playlistId = "playlist123";
  const songId = "song456";
  const userId = "user123";

  it("正常に曲を削除できる", async () => {
    await deletePlaylistSong(playlistId, songId, userId);

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    expect(db.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("削除時にエラーが発生した場合", async () => {
    const mockEqSongType = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Delete error" } });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEqSongType });

    await expect(deletePlaylistSong(playlistId, songId, userId)).rejects.toThrow(
      "Delete error"
    );
    expect(db.delete).not.toHaveBeenCalled();
  });
});
