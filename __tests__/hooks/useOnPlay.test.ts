import useOnPlay from "@/hooks/useOnPlay";
import { supabase } from "@/lib/supabase";

const mockSingle = jest.fn();
mockSingle.mockReturnThis();

const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest
  .fn()
  .mockReturnValue({ select: mockSelect, update: mockUpdate });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

const mockRecordPlay = jest.fn();

jest.mock("@/hooks/usePlayHistory", () => ({
  __esModule: true,
  default: () => ({
    recordPlay: mockRecordPlay,
  }),
}));

describe("useOnPlay", () => {
  const onPlay = useOnPlay();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正常に再生回数を更新し履歴を記録する", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "song1", count: 5 }, error: null }) // select
      .mockResolvedValueOnce({ data: { id: "song1", count: 6 }, error: null }); // update

    mockRecordPlay.mockResolvedValueOnce(undefined);

    const result = await onPlay("song1");

    expect(result).toBe(true);
    expect(mockFrom).toHaveBeenCalledWith("songs");
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockRecordPlay).toHaveBeenCalledWith("song1");
  });

  it("id未指定ならfalse", async () => {
    const result = await onPlay("");

    expect(result).toBe(false);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("曲情報取得でエラーならfalse", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    const result = await onPlay("song1");

    expect(result).toBe(false);
  });

  it("曲情報がnullならfalse", async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await onPlay("song1");

    expect(result).toBe(false);
  });

  it("更新でエラーならfalse", async () => {
    mockSingle
      .mockResolvedValueOnce({ data: { id: "song1", count: 5 }, error: null }) // select
      .mockResolvedValueOnce({
        data: null,
        error: { message: "update error" },
      }); // update

    const result = await onPlay("song1");

    expect(result).toBe(false);
  });

  it("例外発生時もfalse", async () => {
    mockSingle.mockRejectedValueOnce(new Error("unexpected"));

    const result = await onPlay("song1");

    expect(result).toBe(false);
  });
});
