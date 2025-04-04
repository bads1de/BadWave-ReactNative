// 実際のコードをモックする
jest.mock("@/actions/addPlaylistSong", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/actions/getSongById", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/actions/updatePlaylistImage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// モックを実装する
import addPlaylistSong from "@/actions/addPlaylistSong";
import getSongById from "@/actions/getSongById";
import updatePlaylistImage from "@/actions/updatePlaylistImage";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (addPlaylistSong as jest.Mock).mockImplementation(async () => {});
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
    expect(addPlaylistSong).toHaveBeenCalledWith({
      playlistId,
      userId,
      songId,
    });
    expect(getSongById).toHaveBeenCalledWith(songId);
    expect(updatePlaylistImage).toHaveBeenCalled();
  });

  it("曲追加時にエラーが発生した場合", async () => {
    // モックを設定
    (addPlaylistSong as jest.Mock).mockRejectedValueOnce(new Error("DB error"));

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
