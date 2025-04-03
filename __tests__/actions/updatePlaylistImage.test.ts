import updatePlaylistImage from "@/actions/updatePlaylistImage";
import { supabase } from "@/lib/supabase";

const mockEq2 = jest.fn();
mockEq2.mockReturnThis();

const mockUpdate = jest.fn().mockReturnValue({ eq: mockEq2 });

const mockSingle = jest.fn();
mockSingle.mockReturnThis();

const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });

const mockFrom = jest
  .fn()
  .mockReturnValue({ select: mockSelect, update: mockUpdate });

jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockFrom,
  },
}));

describe("updatePlaylistImage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("画像パスが空なら更新する", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { image_path: null },
      error: null,
    });
    mockUpdate.mockResolvedValueOnce({ error: null });

    await expect(updatePlaylistImage("p1", "img.jpg")).resolves.toBeUndefined();

    expect(mockUpdate).toHaveBeenCalled();
  });

  it("画像パスが既にあれば更新しない", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { image_path: "exist.jpg" },
      error: null,
    });

    await expect(updatePlaylistImage("p1", "img.jpg")).resolves.toBeUndefined();

    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("selectでエラーが発生したら例外を投げる", async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: "error" },
    });

    await expect(updatePlaylistImage("p1", "img.jpg")).rejects.toThrow("error");
  });

  it("updateでエラーが発生したら例外を投げる", async () => {
    mockSingle.mockResolvedValueOnce({
      data: { image_path: null },
      error: null,
    });
    mockUpdate.mockResolvedValueOnce({ error: { message: "error" } });

    await expect(updatePlaylistImage("p1", "img.jpg")).rejects.toThrow("error");
  });
});
