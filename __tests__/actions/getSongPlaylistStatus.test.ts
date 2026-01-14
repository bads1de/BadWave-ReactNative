import { mockFunctions } from "@/__mocks__/supabase";
import getSongPlaylistStatus from "@/actions/playlist/getSongPlaylistStatus";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const { mockFrom, mockSelect, mockEq, mockGetSession, mockThen } =
  mockFunctions;

describe("getSongPlaylistStatus", () => {
  const songId = "song-123";
  const userId = "user-456";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: userId } } },
    });
  });

  it("曲が含まれるプレイリストIDの配列を正常に取得できる", async () => {
    const mockData = [{ playlist_id: "p1" }, { playlist_id: "p2" }];

    mockThen.mockImplementationOnce((onFulfilled: any) => {
      return Promise.resolve({ data: mockData, error: null }).then(onFulfilled);
    });

    const result = await getSongPlaylistStatus(songId);

    expect(result).toEqual(["p1", "p2"]);
    expect(mockFrom).toHaveBeenCalledWith("playlist_songs");
    expect(mockSelect).toHaveBeenCalledWith("playlist_id");
    expect(mockEq).toHaveBeenCalledWith("song_id", songId);
    expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    expect(mockEq).toHaveBeenCalledWith("song_type", "regular");
  });

  it("未認証の場合は空配列を返す", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    const result = await getSongPlaylistStatus(songId);

    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("エラーが発生した場合は空配列を返す", async () => {
    mockThen.mockImplementationOnce((onFulfilled: any) => {
      return Promise.resolve({
        data: null,
        error: { message: "Database error" },
      }).then(onFulfilled);
    });

    const result = await getSongPlaylistStatus(songId);

    expect(result).toEqual([]);
  });
});

