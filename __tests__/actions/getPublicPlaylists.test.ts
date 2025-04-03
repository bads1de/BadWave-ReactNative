import getPublicPlaylists from "@/actions/getPublicPlaylists";
import { supabase } from "@/lib/supabase";

const mockLimit = jest.fn();
mockLimit.mockReturnThis();

const mockOrder = jest.fn().mockReturnValue({ limit: mockLimit });
const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("getPublicPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にパブリックプレイリストを取得できる", async () => {
    const playlists = [{ id: "p1" }, { id: "p2" }];
    mockLimit.mockResolvedValueOnce({ data: playlists, error: null });

    const result = await getPublicPlaylists(5);

    expect(result).toEqual(playlists);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
  });

  it("エラーが発生したら空配列", async () => {
    mockLimit.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    const result = await getPublicPlaylists(5);

    expect(result).toEqual([]);
  });
});
