import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetTopPlayedSongs } from "@/hooks/data/useGetTopPlayedSongs";
import getTopPlayedSongs from "@/actions/song/getTopPlayedSongs";

jest.mock("@/actions/song/getTopPlayedSongs", () => ({
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

describe("useGetTopPlayedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("userId を指定して上位再生曲を取得できる", async () => {
    const mockSongs = [
      { id: "s1", title: "S1", play_count: 100 },
      { id: "s2", title: "S2", play_count: 80 },
    ];
    (getTopPlayedSongs as jest.Mock).mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useGetTopPlayedSongs("user1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getTopPlayedSongs).toHaveBeenCalledWith("user1");
    expect(result.current.data).toEqual(mockSongs);
    expect(result.current.error).toBeNull();
  });

  it("userId がない場合はクエリを実行しない", async () => {
    const { result } = renderHook(() => useGetTopPlayedSongs(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getTopPlayedSongs).not.toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
  });

  it("取得に失敗した場合は error を返す", async () => {
    (getTopPlayedSongs as jest.Mock).mockRejectedValue(
      new Error("fetch failed")
    );

    const { result } = renderHook(() => useGetTopPlayedSongs("user1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("fetch failed");
  });
});
