import getLikedSongs from "@/actions/getLikedSongs";
import { supabase } from "@/lib/supabase";

const mockOrder = jest.fn();
mockOrder.mockReturnThis();

const mockEq = jest.fn().mockReturnValue({ order: mockOrder });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
const mockGetSession = jest.fn();

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

describe("getLikedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常に曲一覧を取得できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    const songsData = [
      { songs: { id: "1", title: "Song1" } },
      { songs: { id: "2", title: "Song2" } },
    ];
    mockOrder.mockResolvedValueOnce({ data: songsData, error: null });

    const result = await getLikedSongs();

    expect(result).toEqual([
      { id: "1", title: "Song1" },
      { id: "2", title: "Song2" },
    ]);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
  });

  it("Supabaseクエリでエラーが発生したら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    const result = await getLikedSongs();

    expect(result).toEqual([]);
  });

  it("Supabaseクエリでデータがnullなら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockOrder.mockResolvedValueOnce({ data: null, error: null });

    const result = await getLikedSongs();

    expect(result).toEqual([]);
  });

  it("未認証なら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    const result = await getLikedSongs();

    expect(result).toEqual([]);
  });

  it("getSessionで例外が発生しても空配列", async () => {
    mockGetSession.mockRejectedValueOnce(new Error("session error"));

    const result = await getLikedSongs();

    expect(result).toEqual([]);
  });
});
