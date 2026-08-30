import signInWithGoogleIdToken from "@/actions/auth/signInWithGoogleIdToken";
import { mockFunctions } from "@/__mocks__/supabase";
import { AUTH_ERRORS } from "@/constants/errorMessages";

// supabaseのモックを設定
jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));

const { mockSignInWithIdToken } = mockFunctions;

describe("signInWithGoogleIdToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("IDトークンでサインインできる", async () => {
    mockSignInWithIdToken.mockResolvedValueOnce({
      data: { user: { id: "user1" } },
      error: null,
    });

    await expect(signInWithGoogleIdToken("id-token")).resolves.toBeUndefined();

    expect(mockSignInWithIdToken).toHaveBeenCalledWith({
      provider: "google",
      token: "id-token",
    });
  });

  it("ユーザー情報が取得できない場合、GOOGLE_SIGNIN_FAILED をスローする", async () => {
    mockSignInWithIdToken.mockResolvedValueOnce({
      data: {},
      error: null,
    });

    await expect(signInWithGoogleIdToken("id-token")).rejects.toThrow(
      AUTH_ERRORS.GOOGLE_SIGNIN_FAILED
    );
  });

  it("認証エラー時にエラーをスローする", async () => {
    mockSignInWithIdToken.mockResolvedValueOnce({
      data: {},
      error: new Error("Invalid ID token"),
    });

    await expect(signInWithGoogleIdToken("bad-token")).rejects.toThrow(
      "Invalid ID token"
    );
  });
});
