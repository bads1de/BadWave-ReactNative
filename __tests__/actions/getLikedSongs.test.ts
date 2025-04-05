import getLikedSongs from "../../actions/getLikedSongs";
import { mockFunctions } from "../../__mocks__/supabase";

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => require("../../__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockEq, mockOrder, mockGetSession } =
  mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("getLikedSongs", () => {
  it("正常に曲一覧を取得できる", async () => {
    // モックの設定
    const mockSongs = [
      { id: "1", title: "Song1" },
      { id: "2", title: "Song2" },
    ];

    const mockData = mockSongs.map((song) => ({
      songs: song,
    }));

    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });

    mockOrder.mockResolvedValueOnce({ data: mockData, error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getLikedSongs();

    // 期待値を確認
    expect(result).toEqual(mockSongs);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
    expect(mockSelect).toHaveBeenCalledWith("*, songs(*)");
    expect(mockEq).toHaveBeenCalledWith("user_id", "user123");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("空配列を返す場合", async () => {
    // モックの設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });

    mockOrder.mockResolvedValueOnce({ data: [], error: null });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getLikedSongs();

    // 期待値を確認
    expect(result).toEqual([]);
    expect(mockFrom).toHaveBeenCalledWith("liked_songs_regular");
  });

  it("エラーが発生した場合", async () => {
    // モックの設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });

    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockEq.mockReturnValue({ order: mockOrder });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const result = await getLikedSongs();

    // エラーが発生しても空配列を返すことを確認
    expect(result).toEqual([]);
  });

  it("未認証の場合", async () => {
    // モックの設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // テスト実行
    const result = await getLikedSongs();

    // 未認証の場合は空配列を返すことを確認
    expect(result).toEqual([]);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
