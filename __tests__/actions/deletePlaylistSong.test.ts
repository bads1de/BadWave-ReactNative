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

const { mockFrom, mockDelete, mockEq, mockGetSession } = mockFunctions;
const { db } = require("@/lib/db/client");
const mockWhere = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockGetSession.mockResolvedValue({
    data: { session: { user: { id: "user123" } } },
    error: null,
  });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq });
  mockFrom.mockReturnValue({ delete: mockDelete });
  db.delete.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(undefined);
});

describe("deletePlaylistSong", () => {
  const playlistId = "playlist123";
  const songId = "song456";

  it("正常に曲を削除できる", async () => {
    await deletePlaylistSong(playlistId, songId);

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
    expect(db.delete).toHaveBeenCalled();
    expect(mockWhere).toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    await expect(deletePlaylistSong(playlistId, songId)).rejects.toThrow(
      "User not authenticated"
    );
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("削除時にエラーが発生した場合", async () => {
    const mockEqSongType = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Delete error" } });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEqSongType });

    await expect(deletePlaylistSong(playlistId, songId)).rejects.toThrow(
      "Delete error"
    );
    expect(db.delete).not.toHaveBeenCalled();
  });
});

