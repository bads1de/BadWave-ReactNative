import addPlaylistSong from "@/actions/addPlaylistSong";
import { supabase } from "@/lib/supabase";
import getSongById from "@/actions/getSongById";
import updatePlaylistImage from "@/actions/updatePlaylistImage";

const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

jest.mock("@/actions/getSongById", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/actions/updatePlaylistImage", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("addPlaylistSong", () => {
  const mockGetSongById = getSongById as jest.Mock;
  const mockUpdatePlaylistImage = updatePlaylistImage as jest.Mock;

  const playlistId = "playlist123";
  const userId = "user456";
  const songId = "song789";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に曲を追加し、画像も更新される", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const songData = { id: songId, image_path: "image.jpg" };
    mockGetSongById.mockResolvedValueOnce(songData);

    const result = await addPlaylistSong({ playlistId, userId, songId });

    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockInsert).toHaveBeenCalledWith({
      playlist_id: playlistId,
      user_id: userId,
      song_id: songId,
      song_type: "regular",
    });
    expect(mockGetSongById).toHaveBeenCalledWith(songId);
    expect(mockUpdatePlaylistImage).toHaveBeenCalledWith(
      playlistId,
      "image.jpg"
    );
    expect(result).toEqual({ playlistId, songData });
  });

  it("曲追加時にエラーが発生したら例外を投げる", async () => {
    mockInsert.mockResolvedValueOnce({ error: { message: "DB error" } });

    await expect(
      addPlaylistSong({ playlistId, userId, songId })
    ).rejects.toThrow("DB error");

    expect(mockInsert).toHaveBeenCalled();
    expect(mockGetSongById).not.toHaveBeenCalled();
    expect(mockUpdatePlaylistImage).not.toHaveBeenCalled();
  });

  it("曲に画像がない場合は画像更新しない", async () => {
    mockInsert.mockResolvedValueOnce({ error: null });
    const songData = { id: songId, image_path: null };
    mockGetSongById.mockResolvedValueOnce(songData);

    const result = await addPlaylistSong({ playlistId, userId, songId });

    expect(mockUpdatePlaylistImage).not.toHaveBeenCalled();
    expect(result).toEqual({ playlistId, songData });
  });
});
