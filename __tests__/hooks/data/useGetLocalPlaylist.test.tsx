import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalPlaylist } from "@/hooks/data/useGetLocalPlaylist";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  playlists: { id: "id" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
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

describe("useGetLocalPlaylist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockLimit = jest.fn().mockResolvedValue(resolvedValue);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  const setupMockError = (error: Error) => {
    const mockLimit = jest.fn().mockRejectedValue(error);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("プレイリストIDに基づきSQLiteからデータを取得できる", async () => {
    const mockRow = {
      id: "p1",
      userId: "u1",
      title: "My Playlist",
      imagePath: "img-path",
      isPublic: true,
      createdAt: "2024-01-01",
    };

    setupMockChain([mockRow]);

    const { result } = renderHook(() => useGetLocalPlaylist("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.playlist).not.toBeUndefined(), {
      timeout: 3000,
    });

    expect(result.current.playlist).toEqual({
      id: "p1",
      user_id: "u1",
      title: "My Playlist",
      image_path: "img-path",
      is_public: true,
      created_at: "2024-01-01",
    });
  });

  it("データが見つからない場合は null を返す", async () => {
    setupMockChain([]);

    const { result } = renderHook(() => useGetLocalPlaylist("none"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.playlist).toBeNull();
  });

  it("playlistId がない場合は undefined を返し、DBクエリを実行しない", async () => {
    const { result } = renderHook(() => useGetLocalPlaylist(undefined), {
      wrapper: createWrapper(),
    });

    // enabled: false の場合、クエリは実行されず data は undefined のまま
    expect(result.current.playlist).toBeUndefined();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("エラー発生時に error が設定される", async () => {
    setupMockError(new Error("DB Error"));

    const { result } = renderHook(() => useGetLocalPlaylist("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe("DB Error");
  });
});
