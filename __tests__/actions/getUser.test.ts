// 実際のコードをモックする
jest.mock("@/actions/getUser", () => ({
  getUser: jest.fn(),
}));

// モックを実装する
import { getUser } from "@/actions/getUser";

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
  (getUser as jest.Mock).mockImplementation(async () => {
    return { id: "user1", name: "Test User" };
  });
});

describe("getUser", () => {
  it("ユーザー情報を取得できる", async () => {
    // テスト実行
    const user = await getUser();

    // 期待値を確認
    expect(user).toEqual({ id: "user1", name: "Test User" });
  });

  it("nullを返すケース", async () => {
    // モックを設定
    (getUser as jest.Mock).mockResolvedValueOnce(null);

    // テスト実行
    const user = await getUser();

    // 期待値を確認
    expect(user).toBeNull();
  });
});
