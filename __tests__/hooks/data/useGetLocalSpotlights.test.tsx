import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalSpotlights } from "@/hooks/data/useGetLocalSpotlights";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  spotlights: { createdAt: "createdAt" },
}));

jest.mock("drizzle-orm", () => ({
  desc: jest.fn(),
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

describe("useGetLocalSpotlights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockOrderBy = jest.fn().mockResolvedValue(resolvedValue);
    const mockFrom = jest.fn().mockReturnValue({ orderBy: mockOrderBy });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("スポットライト一覧をSQLiteから取得できる", async () => {
    const mockData = [
      { id: "sp1", title: "Spot 1", author: "A1", videoPath: "path1" },
    ];
    setupMockChain(mockData);

    const { result } = renderHook(() => useGetLocalSpotlights(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].id).toBe("sp1");
  });

  it("データがない場合は空配列を返す", async () => {
    setupMockChain([]);

    const { result } = renderHook(() => useGetLocalSpotlights(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});
