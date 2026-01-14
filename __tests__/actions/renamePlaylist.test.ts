import renamePlaylist from "@/actions/playlist/renamePlaylist";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockUpdate, mockMatch } = mockFunctions;

// モックの設定
mockMatch.mockResolvedValue({ data: null, error: null });

describe("renamePlaylist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にプレイリスト名を変更できる", async () => {
    // モックの設定
    mockMatch.mockResolvedValueOnce({ data: null, error: null });
    mockUpdate.mockReturnValue({ match: mockMatch });
    mockFrom.mockReturnValue({ update: mockUpdate });

    // テスト実行
    await renamePlaylist("p1", "new title", "u1");

    // 検証
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockUpdate).toHaveBeenCalledWith({ title: "new title" });
    expect(mockMatch).toHaveBeenCalledWith({ id: "p1", user_id: "u1" });
  });

  it("タイトルが空なら例外を投げる", async () => {
    await expect(renamePlaylist("p1", "   ", "u1")).rejects.toThrow(
      "プレイリスト名を入力してください"
    );

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("updateでエラーが発生したら例外を投げる", async () => {
    // モックの設定
    mockMatch.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockUpdate.mockReturnValue({ match: mockMatch });
    mockFrom.mockReturnValue({ update: mockUpdate });

    // テスト実行と検証
    await expect(renamePlaylist("p1", "new title", "u1")).rejects.toThrow(
      "error"
    );
  });
});

