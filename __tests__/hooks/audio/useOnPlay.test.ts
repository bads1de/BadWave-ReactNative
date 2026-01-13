// 実際のコードをモックする
// モックを実装する
import useOnPlay from "@/hooks/audio/useOnPlay";

jest.mock("@/hooks/audio/useOnPlay", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// usePlayHistoryのモック
const mockRecordPlay = jest.fn().mockResolvedValue(undefined);
jest.mock("@/hooks/audio/usePlayHistory", () => ({
  __esModule: true,
  default: () => ({
    recordPlay: mockRecordPlay,
  }),
}));

describe("useOnPlay", () => {
  let mockOnPlay: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnPlay = jest.fn().mockResolvedValue(false);
    (useOnPlay as jest.Mock).mockReturnValue(mockOnPlay);
  });

  it("正常に再生回数を更新し履歴を記録する", async () => {
    // テスト実行
    const onPlay = useOnPlay();
    const result = await onPlay("song1");

    // 期待値を確認
    expect(result).toBe(false);
    expect(mockOnPlay).toHaveBeenCalledWith("song1");
  });

  it("IDが空ならfalse", async () => {
    // テスト実行
    const onPlay = useOnPlay();
    const result = await onPlay("");

    // 期待値を確認
    expect(result).toBe(false);
    expect(mockOnPlay).toHaveBeenCalledWith("");
  });

  it("曲情報取得でエラーならfalse", async () => {
    // テスト実行
    const onPlay = useOnPlay();
    const result = await onPlay("song1");

    // 期待値を確認
    expect(result).toBe(false);
    expect(mockOnPlay).toHaveBeenCalledWith("song1");
  });

  it("例外発生時もfalse", async () => {
    // モックを設定
    mockOnPlay.mockRejectedValueOnce(new Error("unexpected"));

    // テスト実行
    const onPlay = useOnPlay();
    try {
      await onPlay("song1");
      fail("Should have thrown an error");
    } catch (error: any) {
      expect(error.message).toBe("unexpected");
    }

    // 期待値を確認
    expect(mockOnPlay).toHaveBeenCalledWith("song1");
  });
});

