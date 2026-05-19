import getPlaylistSongs from "@/actions/playlist/getPlaylistSongs";
import { mockFunctions } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const { mockFrom, mockSelect, mockEq, mockSingle, mockOrder } = mockFunctions;

describe("getPlaylistSongs", () => {
  const playlistId = "playlist1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("非公開プレイリストでuserIdがない場合は空配列", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { is_public: false },
      error: null,
    });

    const result = await getPlaylistSongs(playlistId);

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockSelect).toHaveBeenCalledWith("is_public");
    expect(mockEq).toHaveBeenCalledWith("id", playlistId);
  });

  it("プレイリスト取得エラーの場合", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "Playlist not found" },
    });

    await expect(getPlaylistSongs(playlistId)).rejects.toThrow(
      "Playlist not found"
    );
  });

  it("公開プレイリストで曲一覧を取得できる", async () => {
    // プレイリストの公開設定をモック (公開)
    mockSingle.mockResolvedValueOnce({
      data: { is_public: true },
      error: null,
    });

    // 曲一覧をモック (order がプロミスを返すように設定)
    const mockSongs = [
      { songs: { id: "s1", title: "Song1" }, created_at: "2024-01-01" },
      { songs: { id: "s2", title: "Song2" }, created_at: "2024-01-02" },
    ];
    mockOrder.mockResolvedValueOnce({ data: mockSongs, error: null });

    const result = await getPlaylistSongs(playlistId);

    expect(result).toEqual([
      { id: "s1", title: "Song1", songType: "regular" },
      { id: "s2", title: "Song2", songType: "regular" },
    ]);
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
  });
});
