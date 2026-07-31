import incrementPlayCount from "@/actions/song/incrementPlayCount";
import { mockFunctions } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/db/client", () => ({
  db: {
    update: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  songs: {
    id: "id",
    playCount: "playCount",
  },
}));
jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  sql: jest.fn(() => "play-count-expression"),
}));
jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

const { mockRpc } = mockFunctions;
const { db } = require("@/lib/db/client");

const mockSet = jest.fn();
const mockWhere = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  mockRpc.mockResolvedValue({ data: null, error: null });
  mockSet.mockReturnValue({ where: mockWhere });
  mockWhere.mockResolvedValue(undefined);
  db.update.mockReturnValue({ set: mockSet });
});

describe("incrementPlayCount", () => {
  it("RPC とローカルSQLiteの再生回数を更新する", async () => {
    await incrementPlayCount("song123");

    expect(mockRpc).toHaveBeenCalledWith("increment_song_play_count", {
      song_id: "song123",
    });
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        playCount: "play-count-expression",
        lastPlayedAt: expect.any(Date),
      })
    );
    expect(mockWhere).toHaveBeenCalled();
  });

  it("RPC がエラーを返した場合、reject する", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC error" } });

    await expect(incrementPlayCount("song123")).rejects.toThrow("RPC error");
    expect(mockSet).not.toHaveBeenCalled();
  });
});
