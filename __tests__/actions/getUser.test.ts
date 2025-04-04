// モック関数を定義
const mockSingle = jest.fn();
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
const mockGetSession = jest.fn();

// supabaseのモックを設定
jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: mockFrom,
    auth: {
      getSession: mockGetSession,
    },
  },
}));

// インポート
import { getUser } from "../../actions/getUser";

// モックの動作を設定

describe("getUser", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常にユーザーを取得できる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    const user = { id: "user123", name: "User" };
    mockSingle.mockResolvedValueOnce({ data: user, error: null });

    const result = await getUser();

    expect(result).toEqual(user);
    expect(mockFrom).toHaveBeenCalledWith("users");
  });

  it("認証なしならnullをthrow", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
    });

    await expect(getUser()).rejects.toBeNull();
  });

  it("エラーが発生したら例外を投げる", async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: { user: { id: "user123" } } },
    });
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(getUser()).rejects.toThrow("error");
  });
});
