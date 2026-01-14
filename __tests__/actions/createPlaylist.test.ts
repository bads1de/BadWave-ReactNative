import createPlaylist from "@/actions/playlist/createPlaylist";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockInsert, mockGetSession } = mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("createPlaylist", () => {
  const playlistName = "My Playlist";

  it("正常にプレイリストを作成できる", async () => {
    // モックの設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });
    mockInsert.mockResolvedValueOnce({ data: {}, error: null });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行
    await createPlaylist(playlistName);

    // 期待値を確認
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user123",
      title: playlistName,
    });
  });

  it("未認証の場合", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // テスト実行と期待値を確認
    await expect(createPlaylist(playlistName)).rejects.toThrow(
      "User not authenticated"
    );
  });

  it("DBエラーが発生した場合", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行と期待値を確認
    await expect(createPlaylist(playlistName)).rejects.toThrow("DB error");
  });
});

