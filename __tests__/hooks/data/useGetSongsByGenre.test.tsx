import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetSongsByGenre } from "@/hooks/data/useGetSongsByGenre";
import getSongsByGenre from "@/actions/song/getSongsByGenre";

jest.mock("@/actions/song/getSongsByGenre", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetSongsByGenre", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ジャンルを指定して曲一覧を取得できる", async () => {
    const mockSongs = [
      { id: "s1", title: "S1", genre: "Retro Wave" },
      { id: "s2", title: "S2", genre: "Retro Wave" },
    ];
    (getSongsByGenre as jest.Mock).mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useGetSongsByGenre("Retro Wave"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getSongsByGenre).toHaveBeenCalledWith("Retro Wave");
    expect(result.current.data).toEqual(mockSongs);
    expect(result.current.error).toBeNull();
  });

  it("enabled が false の場合はクエリを実行しない", async () => {
    const { result } = renderHook(() => useGetSongsByGenre("Retro Wave", false), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getSongsByGenre).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("取得に失敗した場合は error を返す", async () => {
    (getSongsByGenre as jest.Mock).mockRejectedValue(new Error("fetch failed"));

    const { result } = renderHook(() => useGetSongsByGenre("Retro Wave"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("fetch failed");
  });
});
