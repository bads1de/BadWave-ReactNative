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
const { mockFrom, mockInsert } = mockFunctions;
const { db } = require("@/lib/db/client");
const mockValues = jest.fn();

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  db.insert.mockReturnValue({ values: mockValues });
  mockValues.mockResolvedValue(undefined);
});

describe("createPlaylist", () => {
  const userId = "user123";
  const playlistName = "My Playlist";

  it("正常にプレイリストを作成できる", async () => {
    // モックの設定
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: "playlist1",
        image_path: null,
        created_at: "2024-01-01",
      },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行
    await createPlaylist({ userId, title: playlistName });

    // 期待値を確認
    expect(mockFrom).toHaveBeenCalledWith("playlists");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      title: playlistName,
      is_public: false,
    });
    expect(db.insert).toHaveBeenCalledWith("playlists");
    expect(mockValues).toHaveBeenCalledWith({
      id: "playlist1",
      userId,
      title: playlistName,
      imagePath: null,
      isPublic: false,
      createdAt: "2024-01-01",
    });
  });

  it("isPublic を指定して作成できる", async () => {
    // モックの設定
    const mockSingle = jest.fn().mockResolvedValue({
      data: {
        id: "playlist2",
        image_path: null,
        created_at: "2024-01-01",
      },
      error: null,
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行
    await createPlaylist({ userId, title: playlistName, isPublic: true });

    // 期待値を確認
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      title: playlistName,
      is_public: true,
    });
  });

  it("DBエラーが発生した場合", async () => {
    // モックの設定
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    mockInsert.mockReturnValue({ select: mockSelect });
    mockFrom.mockReturnValue({ insert: mockInsert });

    // テスト実行と期待値を確認
    await expect(
      createPlaylist({ userId, title: playlistName })
    ).rejects.toThrow("DB error");
    expect(db.insert).not.toHaveBeenCalled();
  });
});
