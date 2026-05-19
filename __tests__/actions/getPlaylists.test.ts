import { mockFunctions } from "@/__mocks__/supabase";
import getPlaylists from "@/actions/playlist/getPlaylists";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockEq, mockOrder } = mockFunctions;

describe("getPlaylists", () => {
  const userId = "user123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にプレイリスト一覧を取得できる", async () => {
    const playlists = [{ id: "p1" }, { id: "p2" }];
    mockOrder.mockResolvedValueOnce({ data: playlists, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getPlaylists(userId);

    expect(result).toEqual(playlists);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockEq).toHaveBeenCalledWith("user_id", userId);
  });

  it("エラーが発生したら空配列を返す", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getPlaylists(userId);

    expect(result).toEqual([]);
  });
});
