import getTopPlayedSongs from "@/actions/getTopPlayedSongs";
import { supabase } from "@/lib/supabase";

const mockRpc = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: mockRpc,
  },
}));

describe("getTopPlayedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("userIdなしなら空配列", async () => {
    const result = await getTopPlayedSongs();

    expect(result).toEqual([]);
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it("正常にトップ再生曲を取得できる", async () => {
    const songs = [{ id: "s1" }, { id: "s2" }];
    mockRpc.mockResolvedValueOnce({ data: songs, error: null });

    const result = await getTopPlayedSongs("user123");

    expect(result).toEqual(songs);
    expect(mockRpc).toHaveBeenCalledWith("get_top_songs", {
      p_user_id: "user123",
      p_period: "day",
    });
  });

  it("rpcでエラーなら例外を投げる", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { message: "error" } });

    await expect(getTopPlayedSongs("user123")).rejects.toThrow("error");
  });
});
