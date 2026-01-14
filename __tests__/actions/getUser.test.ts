import { getUser } from "@/actions/user/getUser";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

// モックのエイリアス
const { mockFrom, mockSelect, mockEq, mockSingle, mockGetSession } =
  mockFunctions;

// テスト前にモックを設定
beforeEach(() => {
  jest.clearAllMocks();
});

describe("getUser", () => {
  it("ユーザー情報を取得できる", async () => {
    // モックの設定
    const mockUser = { id: "user1", name: "Test User" };

    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user1" } } },
      error: null,
    });

    mockSingle.mockResolvedValueOnce({ data: mockUser, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const user = await getUser();

    // 期待値を確認
    expect(user).toEqual(mockUser);
    expect(mockFrom).toHaveBeenCalledWith("users");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("id", "user1");
  });

  it("nullを返すケース", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user1" } } },
      error: null,
    });

    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行
    const user = await getUser();

    // 期待値を確認
    expect(user).toBeNull();
  });

  it("セッションが存在しない場合", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: null,
    });

    // テスト実行と期待値を確認
    await expect(getUser()).rejects.toBeNull();
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("エラーが発生した場合", async () => {
    // モックを設定
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user1" } } },
      error: null,
    });

    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "DB error" },
    });
    mockEq.mockReturnValue({ single: mockSingle });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValue({ select: mockSelect });

    // テスト実行と期待値を確認
    await expect(getUser()).rejects.toThrow("DB error");
  });
});

