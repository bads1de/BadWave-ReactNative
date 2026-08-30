import signUpWithEmail from "@/actions/auth/signUpWithEmail";
import { mockFunctions } from "@/__mocks__/supabase";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const { mockSignUp } = mockFunctions;

describe("signUpWithEmail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("メールアドレスとパスワードでサインアップできる", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: { user: { id: "user1" } },
      error: null,
    });

    await expect(
      signUpWithEmail("test@example.com", "password123")
    ).resolves.toBeUndefined();

    expect(mockSignUp).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("認証エラー時にエラーをスローする", async () => {
    mockSignUp.mockResolvedValueOnce({
      data: {},
      error: new Error("User already registered"),
    });

    await expect(
      signUpWithEmail("test@example.com", "password123")
    ).rejects.toThrow("User already registered");
  });
});
