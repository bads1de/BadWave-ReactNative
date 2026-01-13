import deletePlaylist from "../../actions/deletePlaylist";
import { mockFunctions } from "../../__mocks__/supabase";

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => require("../../__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockDelete, mockEq } = mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("deletePlaylist", () => {
  const playlistId = "playlist123";
  const userId = "user456";

  it("正常にプレイリストと曲を削除できる", async () => {
    // モックの設定
    const mockEqChain = jest
      .fn()
      .mockResolvedValue({ data: null, error: null });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ delete: mockDelete });

    // テスト実行
    await deletePlaylist(playlistId, userId);

    // 期待値を確認
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith("playlist_id", playlistId);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockEq).toHaveBeenCalledWith("id", playlistId);
  });

  it("playlist_songs削除でエラーが発生した場合", async () => {
    // モックの設定
    const mockEqChain = jest
      .fn()
      .mockResolvedValue({
        data: null,
        error: { message: "Delete song error" },
      });
    mockDelete.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ eq: mockEqChain });
    mockFrom.mockReturnValue({ delete: mockDelete });

    // テスト実行と期待値を確認
    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete song error"
    );
  });

  it("playlists削除でエラーが発生した場合", async () => {
    // モックの設定
    const mockEqChain1 = jest
      .fn()
      .mockResolvedValue({ data: null, error: null });
    const mockEqChain2 = jest
      .fn()
      .mockResolvedValue({
        data: null,
        error: { message: "Delete playlist error" },
      });

    // 最初の呼び出し用のモック
    mockDelete.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEqChain1 });

    // 2回目の呼び出し用のモック
    mockDelete.mockReturnValueOnce({ eq: mockEq });
    mockEq.mockReturnValueOnce({ eq: mockEqChain2 });

    mockFrom.mockReturnValue({ delete: mockDelete });

    // テスト実行と期待値を確認
    await expect(deletePlaylist(playlistId, userId)).rejects.toThrow(
      "Delete playlist error"
    );
  });
});

