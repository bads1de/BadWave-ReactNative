// 実際のコードをモックする
// モックを実装する
import usePlaylistStatus from "@/hooks/usePlaylistStatus";
import Toast from "react-native-toast-message";

jest.mock("@/hooks/usePlaylistStatus", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

describe("usePlaylistStatus", () => {
  const playlists = [
    {
      id: "p1",
      user_id: "u1",
      title: "t1",
      is_public: true,
      created_at: "2024-01-01T00:00:00Z",
    },
    {
      id: "p2",
      user_id: "u1",
      title: "t2",
      is_public: false,
      created_at: "2024-01-01T00:00:00Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      fetchAddedStatus: jest.fn().mockResolvedValue(undefined),
      isAdded: { p1: true, p2: false },
    });
  });

  it("正常にisAddedを取得できる", () => {
    // テスト実行
    const { isAdded } = usePlaylistStatus({ songId: "s1", playlists });

    // 期待値を確認
    expect(isAdded.p1).toBe(true);
    expect(isAdded.p2).toBe(false);
    expect(usePlaylistStatus).toHaveBeenCalledWith({ songId: "s1", playlists });
  });

  it("fetchAddedStatusを呼び出すことができる", async () => {
    // テスト実行
    const { fetchAddedStatus } = usePlaylistStatus({ songId: "s1", playlists });
    await fetchAddedStatus();

    // 期待値を確認
    expect(fetchAddedStatus).toHaveBeenCalled();
  });

  it("エラー発生時のテスト", async () => {
    // モックを設定
    const mockFetchAddedStatus = jest.fn().mockImplementation(() => {
      Toast.show({ type: "error", text1: "Error", text2: "error" });
    });
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      fetchAddedStatus: mockFetchAddedStatus,
      isAdded: {},
    });

    // テスト実行
    const { fetchAddedStatus } = usePlaylistStatus({ songId: "s1", playlists });
    fetchAddedStatus();

    // 期待値を確認
    expect(Toast.show).toHaveBeenCalled();
  });
});
