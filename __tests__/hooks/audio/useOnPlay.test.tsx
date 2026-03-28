import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import useOnPlay from "@/hooks/audio/useOnPlay";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import usePlayHistory from "@/hooks/audio/usePlayHistory";
import { CACHED_QUERIES } from "@/constants";
import { songs } from "@/lib/db/schema";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    update: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  songs: {
    id: "id",
    playCount: "playCount",
  },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  sql: jest.fn(() => "play-count-expression"),
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock("@/hooks/audio/usePlayHistory", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn: () => Promise<unknown>) => fn()),
}));

const mockSupabaseRpc = supabase.rpc as jest.Mock;
const mockDbUpdate = db.update as jest.Mock;
const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
const mockUsePlayHistory = usePlayHistory as jest.Mock;

describe("useOnPlay", () => {
  let queryClient: QueryClient;
  let mockRecordPlay: jest.Mock<any>;
  let mockSet: jest.Mock<any>;
  let mockWhere: jest.Mock<any>;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // @ts-expect-error jest mock type limitation
    mockRecordPlay = jest.fn().mockResolvedValue(undefined);
    // @ts-expect-error jest mock type limitation
    mockWhere = jest.fn().mockResolvedValue(undefined);
    mockSet = jest.fn().mockReturnValue({ where: mockWhere });

    (supabase.rpc as jest.Mock<any>).mockResolvedValue({ error: null });
    mockDbUpdate.mockReturnValue({ set: mockSet });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    mockUsePlayHistory.mockReturnValue({ recordPlay: mockRecordPlay });
  });

  it("Supabase と SQLite を更新し、関連 query を無効化する", async () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useOnPlay(), {
      wrapper: createWrapper(),
    });

    let outcome = false;
    await act(async () => {
      outcome = await result.current("song-1");
    });

    expect(outcome).toBe(true);
    expect(mockSupabaseRpc).toHaveBeenCalledWith(
      "increment_song_play_count",
      { song_id: "song-1" },
    );
    expect(mockDbUpdate).toHaveBeenCalledWith(songs);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        playCount: "play-count-expression",
        lastPlayedAt: expect.any(Date),
      }),
    );
    expect(mockWhere).toHaveBeenCalled();
    expect(mockRecordPlay).toHaveBeenCalledWith("song-1");

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.songs],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.song],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.songsByGenre],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlistSongs],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.trendsSongs],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.topPlayedSongs],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.getRecommendations],
    });
  });

  it("オフラインなら何も更新しない", async () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const { result } = renderHook(() => useOnPlay(), {
      wrapper: createWrapper(),
    });

    let outcome = true;
    await act(async () => {
      outcome = await result.current("song-1");
    });

    expect(outcome).toBe(false);
    expect(mockSupabaseRpc).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
    expect(mockRecordPlay).not.toHaveBeenCalled();
  });

  it("ID が空なら何も更新しない", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useOnPlay(), {
      wrapper: createWrapper(),
    });

    let outcome = true;
    await act(async () => {
      outcome = await result.current("");
    });

    expect(outcome).toBe(false);
    expect(mockSupabaseRpc).not.toHaveBeenCalled();
    expect(mockDbUpdate).not.toHaveBeenCalled();
    expect(mockRecordPlay).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
