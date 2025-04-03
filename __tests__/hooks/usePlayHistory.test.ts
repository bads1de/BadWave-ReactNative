import usePlayHistory from "@/hooks/usePlayHistory";
import { supabase } from "@/lib/supabase";

const mockInsert = jest.fn();
const mockFrom = jest.fn().mockReturnValue({ insert: mockInsert });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

const mockUseUser = jest.fn();

jest.mock("@/actions/getUser", () => ({
  useUser: () => mockUseUser(),
}));

describe("usePlayHistory", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("認証済みで正常に再生履歴を記録する", async () => {
    mockUseUser.mockReturnValue({ data: { id: "user123" } });
    mockInsert.mockResolvedValueOnce({ error: null });

    const { recordPlay } = usePlayHistory();

    await recordPlay("song1");

    expect(mockFrom).toHaveBeenCalledWith("play_history");
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user123",
      song_id: "song1",
    });
  });

  it("認証なしなら何もしない", async () => {
    mockUseUser.mockReturnValue({ data: null });

    const { recordPlay } = usePlayHistory();

    await recordPlay("song1");

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("songIdなしなら何もしない", async () => {
    mockUseUser.mockReturnValue({ data: { id: "user123" } });

    const { recordPlay } = usePlayHistory();

    await recordPlay("");

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("insertでエラーが発生してもconsole.error", async () => {
    mockUseUser.mockReturnValue({ data: { id: "user123" } });
    mockInsert.mockResolvedValueOnce({ error: { message: "error" } });
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { recordPlay } = usePlayHistory();

    await recordPlay("song1");

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
