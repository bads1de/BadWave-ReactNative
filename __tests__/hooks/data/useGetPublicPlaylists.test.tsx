import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetPublicPlaylists } from "@/hooks/data/useGetPublicPlaylists";
import getPublicPlaylists from "@/actions/playlist/getPublicPlaylists";

jest.mock("@/actions/playlist/getPublicPlaylists", () => ({
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

describe("useGetPublicPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("公開プレイリスト一覧を取得し、データを返す", async () => {
    const mockPlaylists = [
      { id: "p1", title: "P1", isPublic: true },
      { id: "p2", title: "P2", isPublic: true },
    ];
    (getPublicPlaylists as jest.Mock).mockResolvedValue(mockPlaylists);

    const { result } = renderHook(() => useGetPublicPlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getPublicPlaylists).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(mockPlaylists);
    expect(result.current.error).toBeNull();
  });

  it("limit を指定して action に渡せる", async () => {
    (getPublicPlaylists as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useGetPublicPlaylists(5), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(getPublicPlaylists).toHaveBeenCalledWith(5);
  });

  it("取得に失敗した場合は error を返す", async () => {
    (getPublicPlaylists as jest.Mock).mockRejectedValue(
      new Error("fetch failed")
    );

    const { result } = renderHook(() => useGetPublicPlaylists(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("fetch failed");
  });
});
