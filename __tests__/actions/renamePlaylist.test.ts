import renamePlaylist from "@/actions/renamePlaylist";
import { supabase } from "@/lib/supabase";

const mockEq = jest.fn();
mockEq.mockReturnThis();

const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ update: mockUpdate });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("renamePlaylist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常にプレイリスト名を変更できる", async () => {
    mockUpdate.mockResolvedValueOnce({ error: null });

    await expect(
      renamePlaylist("p1", "new title", "u1")
    ).resolves.toBeUndefined();

    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("タイトルが空なら例外を投げる", async () => {
    await expect(renamePlaylist("p1", "   ", "u1")).rejects.toThrow(
      "プレイリスト名を入力してください"
    );

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("updateでエラーが発生したら例外を投げる", async () => {
    mockUpdate.mockResolvedValueOnce({ error: { message: "error" } });

    await expect(renamePlaylist("p1", "new title", "u1")).rejects.toThrow(
      "error"
    );
  });
});
