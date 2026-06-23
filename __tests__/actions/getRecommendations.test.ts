import getRecommendations from "@/actions/song/getRecommendations";
import { supabase } from "@/lib/supabase";

const mockRpc = supabase.rpc as jest.Mock;

describe("getRecommendations", () => {
  const userId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に推薦曲を取得できる", async () => {
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

    const result = await getRecommendations(userId, 5);

    expect(result).toEqual([
      {
        id: "s1",
        title: "Song1",
        author: "A",
        song_path: "p",
        image_path: "i",
        genre: "g",
        count: "0",
        like_count: "0",
        created_at: undefined,
        user_id: userId,
        recommendation_score: 0.9,
      },
    ]);
  });

  it("rpcでエラーなら空配列", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "error" } });

    const result = await getRecommendations(userId, 5);

    expect(result).toEqual([]);
  });

  it("rpcで空配列なら空配列", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const result = await getRecommendations(userId, 5);

    expect(result).toEqual([]);
  });

  it("例外発生時も空配列", async () => {
    mockRpc.mockRejectedValueOnce(new Error("unexpected"));

    const result = await getRecommendations(userId, 5);

    expect(result).toEqual([]);
  });
});
