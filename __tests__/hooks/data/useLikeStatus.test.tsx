import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useLikeStatus } from "@/hooks/data/useLikeStatus";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  likedSongs: { userId: "userId", songId: "songId" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
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

describe("useLikeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockLimit = jest.fn().mockResolvedValue(resolvedValue);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("いいねされている場合: true を返す", async () => {
    setupMockChain([{ userId: "u1", songId: "s1" }]);

    const { result } = renderHook(() => useLikeStatus("s1", "u1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLiked).toBe(true);
  });

  it("いいねされていない場合: false を返す", async () => {
    setupMockChain([]);

    const { result } = renderHook(() => useLikeStatus("s1", "u1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLiked).toBe(false);
  });

  it("userId がない場合: false を返し、クエリを実行しない", async () => {
    const { result } = renderHook(() => useLikeStatus("s1", undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLiked).toBe(false);
    expect(db.select).not.toHaveBeenCalled();
  });
});
