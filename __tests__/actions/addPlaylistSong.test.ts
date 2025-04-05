// 実際のコードをモックする
import addPlaylistSong from "../../actions/addPlaylistSong";
import getSongById from "../../actions/getSongById";
import updatePlaylistImage from "../../actions/updatePlaylistImage";
import { mockFunctions } from "../../__mocks__/supabase";

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => require("../../__mocks__/supabase"));

// モックの設定
jest.mock("../../actions/getSongById");
jest.mock("../../actions/updatePlaylistImage");

// モックのエイリアス
const { mockFrom, mockInsert } = mockFunctions;

// モックの設定
mockInsert.mockResolvedValue({ data: null, error: null });
mockFrom.mockReturnValue({ insert: mockInsert });

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getSongById as jest.Mock).mockImplementation(async () => ({
    id: "s1",
    title: "Song1",
    image_path: "/test/image.jpg",
  }));
  (updatePlaylistImage as jest.Mock).mockImplementation(async () => {});
});

describe("addPlaylistSong", () => {
  const playlistId = "playlist123";
  const userId = "user456";
  const songId = "song789";

  it("正常に曲を追加し、画像も更新される", async () => {
    // テスト実行
    await addPlaylistSong({ playlistId, userId, songId });

    // 期待値を確認
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockInsert).toHaveBeenCalledWith({
      playlist_id: playlistId,
      user_id: userId,
      song_id: songId,
      song_type: "regular",
    });
    expect(getSongById).toHaveBeenCalledWith(songId);
    expect(updatePlaylistImage).toHaveBeenCalled();
  });

  it("曲追加時にエラーが発生した場合", async () => {
    // モックを設定
    mockInsert.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });

    // テスト実行と期待値を確認
    await expect(
      addPlaylistSong({ playlistId, userId, songId })
    ).rejects.toThrow("DB error");
  });

  it("曲に画像がない場合", async () => {
    // モックを設定
    (getSongById as jest.Mock).mockImplementationOnce(async () => ({
      id: "s1",
      title: "Song1",
      image_path: null,
    }));

    // テスト実行
    await addPlaylistSong({ playlistId, userId, songId });

    // 期待値を確認
    expect(getSongById).toHaveBeenCalledWith(songId);
    expect(updatePlaylistImage).not.toHaveBeenCalled();
  });
});
