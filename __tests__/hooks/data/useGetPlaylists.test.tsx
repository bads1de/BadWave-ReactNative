import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  playlists: { userId: "userId" },
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

describe("useGetPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockWhere = jest.fn().mockResolvedValue(resolvedValue);
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("ユーザーのプレイリスト一覧をSQLiteから取得できる", async () => {
    const userId = "u1";
    const mockRows = [
      { id: "p1", userId: "u1", title: "P1", isPublic: true },
      { id: "p2", userId: "u1", title: "P2", isPublic: false },
    ];

    setupMockChain(mockRows);

    const { result } = renderHook(() => useGetPlaylists(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });

    expect(result.current.playlists.length).toBe(2);
    expect(result.current.playlists[0].id).toBe("p1");
    expect(result.current.playlists[1].title).toBe("P2");
  });

  it("userIdがない場合は空配列を返し、DBクエリを実行しない", async () => {
    const { result } = renderHook(() => useGetPlaylists(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.playlists).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });
});
