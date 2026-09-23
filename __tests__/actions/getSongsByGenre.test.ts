import getSongsByGenre from "@/actions/song/getSongsByGenre";
import { mockFunctions } from "@/__mocks__/supabase";

jest.mock("@/lib/supabase", () => require("@/__mocks__/supabase"));
jest.mock("@/lib/utils/retry", () => ({
  // 実装と同じく、result.error は例外化する
  withSupabaseRetry: jest.fn(async (fn: () => Promise<unknown>) => {
    const result = await fn();
    if (
      result !== null &&
      typeof result === "object" &&
      "error" in result &&
      (result as { error: unknown }).error
    ) {
      const err = (result as { error: { message?: string } }).error;
      throw new Error(err?.message ?? String(err));
    }
    return result;
  }),
}));

const { mockFrom, mockSelect, mockOr, mockOrder } = mockFunctions;

const songs = [
  { id: "s1", title: "Song 1", author: "Artist 1" },
  { id: "s2", title: "Song 2", author: "Artist 2" },
];

let consoleErrorSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  mockSelect.mockReturnValue({ or: mockOr });
  mockOr.mockReturnValue({ order: mockOrder });
  mockOrder.mockResolvedValue({ data: songs, error: null });
  consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  consoleErrorSpy.mockRestore();
});

describe("getSongsByGenre", () => {
  it("単一ジャンルで曲を検索できる", async () => {
    await expect(getSongsByGenre("Pop")).resolves.toEqual(songs);

    expect(mockFrom).toHaveBeenCalledWith("songs");
    expect(mockOr).toHaveBeenCalledWith('genre.ilike."%Pop%"');
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
  });

  it("カンマ区切りで複数ジャンルを検索できる", async () => {
    await getSongsByGenre("Pop, Rock");

    expect(mockOr).toHaveBeenCalledWith(
      'genre.ilike."%Pop%",genre.ilike."%Rock%"',
    );
  });

  it("空要素は無視する（全件一致を防ぐ）", async () => {
    await getSongsByGenre("Pop,");

    // 空要素が残ると "genre.ilike.%%" になり全曲ヒットしてしまう
    expect(mockOr).toHaveBeenCalledWith('genre.ilike."%Pop%"');
  });

  it("ジャンルが空の場合はクエリせず空配列を返す", async () => {
    await expect(getSongsByGenre("")).resolves.toEqual([]);
    await expect(getSongsByGenre("  ")).resolves.toEqual([]);
    await expect(getSongsByGenre([" ", ""])).resolves.toEqual([]);

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("ジャンル名の LIKE ワイルドカードと .or() 予約文字を無害化する", async () => {
    await getSongsByGenre(["50%_off", "a,b(c)"]);

    // LIKE ワイルドカードは \ でエスケープ、予約文字 ,() は値全体を "..." で括る
    expect(mockOr).toHaveBeenCalledWith(
      'genre.ilike."%50\\%\\_off%",genre.ilike."%a,b(c)%"',
    );
  });

  it("クエリが失敗した場合は例外を投げる", async () => {
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "DB error" },
    });

    await expect(getSongsByGenre("Pop")).rejects.toThrow("DB error");
  });
});
