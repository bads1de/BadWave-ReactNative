import createPlaylist from "@/actions/playlist/createPlaylist";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn(),
  },
}));
jest.mock("@/lib/db/schema", () => ({
  playlists: "playlists",
}));

// モックのエイリアス
const { mockFrom, mockInsert, mockGetSession } = mockFunctions;
const { db } = require("@/lib/db/client");
const mockValues = jest.fn();

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  db.insert.mockReturnValue({ values: mockValues });
  mockValues.mockResolvedValue(undefined);
});

describe("createPlaylist", () => {
  const playlistName = "My Playlist";

  it("正常にプレイリストを作成できる", async () => {
    // モックの設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: "playlist1",
        title: playlistName,
        image_path: null,
        is_public: false,
        created_at: "2024-01-01",
      },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行
    await createPlaylist(playlistName);

    // 期待値を確認
    expect(mockGetSession).toHaveBeenCalled();
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user123",
      title: playlistName,
    });
    expect(db.insert).toHaveBeenCalledWith("playlists");
    expect(mockValues).toHaveBeenCalledWith({
      id: "playlist1",
      userId: "user123",
      title: playlistName,
      imagePath: null,
      isPublic: false,
      createdAt: "2024-01-01",
    });
  });

  it("未認証の場合", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // テスト実行と期待値を確認
    await expect(createPlaylist(playlistName)).rejects.toThrow(
      "User not authenticated"
    );
  });

  it("DBエラーが発生した場合", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
      error: null,
    });
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行と期待値を確認
    await expect(createPlaylist(playlistName)).rejects.toThrow("DB error");
    expect(db.insert).not.toHaveBeenCalled();
  });
});

