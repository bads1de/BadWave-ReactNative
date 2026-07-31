import toggleLike from "@/actions/song/toggleLike";
import { mockFunctions } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/db/client", () => ({
  db: {
    query: {
      songs: {
        findFirst: jest.fn(),
      },
    },
    insert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  likedSongs: {
    userId: "userId",
    songId: "songId",
  },
  songs: {
    id: "id",
    likeCount: "likeCount",
  },
}));
jest.mock("drizzle-orm", () => ({
  and: jest.fn((...conditions) => conditions),
  eq: jest.fn((field, value) => ({ field, value })),
}));
jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

const { mockFrom, mockInsert, mockDelete, mockRpc } = mockFunctions;
const { db } = require("@/lib/db/client");

const songId = "song123";
const userId = "user456";

const mockSet = jest.fn();
const mockWhere = jest.fn();
const mockFinalDeleteEq = jest.fn();
const mockDeleteEq = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Supabase モック
  mockFrom.mockReturnValue({ insert: mockInsert, delete: mockDelete });
  mockDelete.mockReturnValue({ eq: mockDeleteEq });
  mockDeleteEq.mockReturnValue({ eq: mockFinalDeleteEq });
  mockFinalDeleteEq.mockResolvedValue({ data: null, error: null });
  mockRpc.mockResolvedValue({ data: null, error: null });

  // ローカルDB モック
  db.query.songs.findFirst.mockResolvedValue({ likeCount: 5 });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(undefined);
  db.update.mockReturnValue({ set: mockSet });
  db.insert.mockReturnValue({ values: jest.fn().mockResolvedValue(undefined) });
  db.delete.mockReturnValue({ where: mockWhere });
});

describe("toggleLike", () => {
  it("いいねを追加すると Supabase / SQLite の両方に反映され、true を返す", async () => {
    mockInsert.mockResolvedValue({ data: null, error: null });

    const result = await toggleLike(songId, userId, false);

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      song_id: songId,
    });
    expect(mockRpc).toHaveBeenCalledWith("increment_like_count", {
      song_id: songId,
      increment_value: 1,
    });
    expect(db.insert).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it("いいねを解除すると Supabase / SQLite の両方から削除され、false を返す", async () => {
    const result = await toggleLike(songId, userId, true);

    expect(result).toBe(false);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
    expect(mockDeleteEq).toHaveBeenCalledWith("user_id", userId);
    expect(mockFinalDeleteEq).toHaveBeenCalledWith("song_id", songId);
    expect(mockRpc).toHaveBeenCalledWith("increment_like_count", {
      song_id: songId,
      increment_value: -1,
    });
    expect(db.delete).toHaveBeenCalled();
    expect(db.update).toHaveBeenCalled();
  });

  it("いいね追加時に Supabase エラーが発生した場合、reject する", async () => {
    mockInsert.mockResolvedValue({ data: null, error: { message: "Insert error" } });

    await expect(toggleLike(songId, userId, false)).rejects.toThrow(
      "Insert error"
    );
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("いいね解除時に Supabase エラーが発生した場合、reject する", async () => {
    mockFinalDeleteEq.mockResolvedValue({
      data: null,
      error: { message: "Delete error" },
    });

    await expect(toggleLike(songId, userId, true)).rejects.toThrow(
      "Delete error"
    );
    expect(db.delete).not.toHaveBeenCalled();
  });
});
