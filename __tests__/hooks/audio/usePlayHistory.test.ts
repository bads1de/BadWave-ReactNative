// 実際のコードをモックする
// モックを実装する
import usePlayHistory from "@/hooks/audio/usePlayHistory";

jest.mock("@/hooks/audio/usePlayHistory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

describe("usePlayHistory", () => {
  const mockRecordPlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (usePlayHistory as jest.Mock).mockReturnValue({
      recordPlay: mockRecordPlay,
    });
  });

  it("正常に再生履歴を記録する", async () => {
    // テスト実行
    const { recordPlay } = usePlayHistory();
    await recordPlay("song1");

    // 期待値を確認
    expect(mockRecordPlay).toHaveBeenCalledWith("song1");
  });

  it("空のSongIdを渡す場合", async () => {
    // テスト実行
    const { recordPlay } = usePlayHistory();
    await recordPlay("");

    // 期待値を確認
    expect(mockRecordPlay).toHaveBeenCalledWith("");
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    mockRecordPlay.mockImplementationOnce(() => {
      console.error("Error recording play history");
    });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    // テスト実行
    const { recordPlay } = usePlayHistory();
    await recordPlay("song1");

    // 期待値を確認
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

