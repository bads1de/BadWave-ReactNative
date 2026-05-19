import getLikedSongs from "@/actions/song/getLikedSongs";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockEq, mockOrder } = mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("getLikedSongs", () => {
  const userId = "user123";

  it("正常に曲一覧を取得できる", async () => {
    const mockSongs = [
      { id: "1", title: "Song1" },
      { id: "2", title: "Song2" },
    ];

    const mockData = mockSongs.map((song) => ({
      songs: song,
    }));

    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getLikedSongs(userId);

    expect(result).toEqual(mockSongs);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
    expect(mockSelect).toHaveBeenCalledWith("*, songs(*)");
    expect(mockEq).toHaveBeenCalledWith("user_id", userId);
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("空配列を返す場合", async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getLikedSongs(userId);

    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
  });

  it("エラーが発生した場合", async () => {
    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    const result = await getLikedSongs(userId);

    expect(result).toEqual([]);
  });
});
