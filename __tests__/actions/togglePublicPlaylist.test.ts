import togglePublicPlaylist from "@/actions/playlist/togglePublicPlaylist";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));
jest.mock("@/lib/db/client", () => ({
  db: {
    update: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  playlists: {
    id: "id",
    userId: "userId",
  },
}));
jest.mock("drizzle-orm", () => ({
  and: jest.fn((...conditions) => conditions),
  eq: jest.fn((field, value) => ({ field, value })),
}));
jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn) => fn()),
}));

const { db } = require("@/lib/db/client");
const { supabase } = require("@/lib/supabase");
const { withSupabaseRetry } = require("@/lib/utils/retry");
const mockEqFinal = jest.fn();
const mockEqFirst = jest.fn(() => ({ eq: mockEqFinal }));
const mockUpdate = jest.fn(() => ({ eq: mockEqFirst }));
const mockWhere = jest.fn();
const mockSet = jest.fn(() => ({ where: mockWhere }));

beforeEach(() => {
  jest.clearAllMocks();
  supabase.from.mockReturnValue({ update: mockUpdate });
  mockEqFinal.mockResolvedValue({ error: null });
  db.update.mockReturnValue({ set: mockSet });
  mockWhere.mockResolvedValue(undefined);
});

describe("togglePublicPlaylist", () => {
  it("正常に公開設定を切り替えられる", async () => {
    await togglePublicPlaylist("p1", "u1", true);

    expect(withSupabaseRetry).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith("playlists");
    expect(mockUpdate).toHaveBeenCalledWith({ is_public: true });
    expect(db.update).toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalledWith({ isPublic: true });
    expect(mockWhere).toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    mockEqFinal.mockResolvedValueOnce({ error: { message: "error" } });

    await expect(togglePublicPlaylist("p1", "u1", false)).rejects.toThrow(
      "error"
    );
    expect(db.update).not.toHaveBeenCalled();
  });
});

