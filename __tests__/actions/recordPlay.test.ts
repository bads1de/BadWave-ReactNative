import recordPlay from "@/actions/user/recordPlay";
import { mockFunctions } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

const { mockFrom, mockInsert } = mockFunctions;

const songId = "song123";
const userId = "user456";

beforeEach(() => {
  jest.clearAllMocks();
  mockInsert.mockResolvedValue({ data: null, error: null });
  mockFrom.mockReturnValue({ insert: mockInsert });
});

describe("recordPlay", () => {
  it("再生履歴を Supabase に記録する", async () => {
    await recordPlay(songId, userId);

    expect(mockFrom).toHaveBeenCalledWith("play_history");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: userId,
      song_id: songId,
    });
  });

  it("エラーが発生した場合も例外を投げずにログを出力する", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockInsert.mockResolvedValue({
      data: null,
      error: { message: "Insert error" },
    });

    await expect(recordPlay(songId, userId)).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
