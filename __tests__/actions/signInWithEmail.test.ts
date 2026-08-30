import signInWithEmail from "@/actions/auth/signInWithEmail";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const { mockSignInWithPassword } = mockFunctions;

describe("signInWithEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("メールアドレスとパスワードでサインインできる", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: "user1" } },
      error: null,
    });

    await expect(
      signInWithEmail("test@example.com", "password123")
    ).resolves.toBeUndefined();

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("認証エラー時にエラーをスローする", async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: {},
      error: new Error("Invalid login credentials"),
    });

    await expect(
      signInWithEmail("test@example.com", "wrong-password")
    ).rejects.toThrow("Invalid login credentials");
  });
});
