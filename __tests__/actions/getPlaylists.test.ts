import { mockFunctions } from "../../__mocks__/supabase";

// インポート
import getPlaylists from "../../actions/getPlaylists";

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => require("../../__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockEq, mockOrder, mockGetSession } =
  mockFunctions;

// モックの設定
mockGetSession.mockResolvedValue({
  data: { session: { user: { id: "user123" } } },
});

// モックのチェーンを設定
mockOrder.mockResolvedValue({ data: null, error: null });

describe("getPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常にプレイリスト一覧を取得できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    const playlists = [{ id: "p1" }, { id: "p2" }];
    mockOrder.mockResolvedValueOnce({ data: playlists, error: null });

    const result = await getPlaylists();

    expect(result).toEqual(playlists);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
  });

  it("エラーが発生したら空配列を返す", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    const result = await getPlaylists();
    expect(result).toEqual([]);
  });
});

