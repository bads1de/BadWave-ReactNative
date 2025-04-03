import getPlaylistSongs from "@/actions/getPlaylistSongs";
import { supabase } from "@/lib/supabase";

const mockOrder = jest.fn();
mockOrder.mockReturnThis();

const mockEq = jest
  .fn()
  .mockReturnValue({ order: mockOrder, single: jest.fn() });
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

describe("getPlaylistSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("公開プレイリストで曲一覧を取得できる", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const mockSingle = jest.fn().mockResolvedValueOnce({
      data: { is_public: true },
      error: null,
    });
    mockEq.mockReturnValueOnce({ order: mockOrder, single: mockSingle });

    const songsData = [
      { songs: { id: "s1", title: "Song1" } },
      { songs: { id: "s2", title: "Song2" } },
    ];
    mockOrder.mockResolvedValueOnce({ data: songsData, error: null });

    const result = await getPlaylistSongs("playlist1");

    expect(result).toEqual([
      { id: "s1", title: "Song1", songType: "regular" },
      { id: "s2", title: "Song2", songType: "regular" },
    ]);
  });

  it("非公開で未認証なら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const mockSingle = jest.fn().mockResolvedValueOnce({
      data: { is_public: false },
      error: null,
    });
    mockEq.mockReturnValueOnce({ order: mockOrder, single: mockSingle });

    const result = await getPlaylistSongs("playlist1");

    expect(result).toEqual([]);
  });

  it("playlist取得でエラーなら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({ data: { session: null } });
    const mockSingle = jest.fn().mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });
    mockEq.mockReturnValueOnce({ order: mockOrder, single: mockSingle });

    const result = await getPlaylistSongs("playlist1");

    expect(result).toEqual([]);
  });

  it("曲取得でエラーなら空配列", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "u1" } } },
    });
    const mockSingle = jest.fn().mockResolvedValueOnce({
      data: { is_public: true },
      error: null,
    });
    mockEq.mockReturnValueOnce({ order: mockOrder, single: mockSingle });

    mockOrder.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    const result = await getPlaylistSongs("playlist1");

    expect(result).toEqual([]);
  });
});
