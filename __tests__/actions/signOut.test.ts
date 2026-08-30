import signOut from "@/actions/auth/signOut";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const { mockSignOut } = mockFunctions;

describe("signOut", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("サインアウトできる", async () => {
    mockSignOut.mockResolvedValueOnce({ error: null });

    await expect(signOut()).resolves.toBeUndefined();

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it("エラー時にエラーをスローする", async () => {
    mockSignOut.mockResolvedValueOnce({
      error: new Error("Sign out failed"),
    });

    await expect(signOut()).rejects.toThrow("Sign out failed");
  });
});
