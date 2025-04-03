import getRecommendations from "@/actions/getRecommendations";
import { supabase } from "@/lib/supabase";

const mockRpc = jest.fn();
const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

describe("getRecommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常に推薦曲を取得できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    const rpcData = [
      {
        id: "s1",
        title: "Song1",
        author: "A",
        song_path: "p",
        image_path: "i",
        genre: "g",
        score: 0.9,
      },
    ];
    mockRpc.mockResolvedValueOnce({ data: rpcData, error: null });

    const result = await getRecommendations(5);

    expect(result).toEqual([
      {
        id: "s1",
        title: "Song1",
        author: "A",
        song_path: "p",
        image_path: "i",
        genre: "g",
        count: 0,
        like_count: 0,
        created_at: undefined,
        user_id: "user123",
        recommendation_score: 0.9,
      },
    ]);
  });

  it("認証なしなら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    const result = await getRecommendations(5);

    expect(result).toEqual([]);
  });

  it("rpcでエラーなら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "error" } });

    const result = await getRecommendations(5);

    expect(result).toEqual([]);
  });

  it("rpcで空配列なら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await getRecommendations(5);

    expect(result).toEqual([]);
  });

  it("例外発生時も空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockRpc.mockRejectedValueOnce(new Error("unexpected"));

    const result = await getRecommendations(5);

    expect(result).toEqual([]);
  });
});
