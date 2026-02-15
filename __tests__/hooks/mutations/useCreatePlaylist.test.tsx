import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useCreatePlaylist } from "@/hooks/mutations/useCreatePlaylist";
import { CACHED_QUERIES } from "@/constants";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  playlists: {
    id: "id",
    userId: "userId",
    title: "title",
    isPublic: "isPublic",
    createdAt: "createdAt",
    imagePath: "imagePath",
  },
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn) => fn()),
}));

const _supabase = require("@/lib/supabase").supabase;
const { db } = require("@/lib/db/client");
const { useNetworkStatus } = require("@/hooks/common/useNetworkStatus");

describe("useCreatePlaylist", () => {
  let queryClient: QueryClient;

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
    useNetworkStatus.mockReturnValue({ isOnline: true });
  });

  it("成功時: SupabaseとSQLiteに保存し、クエリを無効化する", async () => {
    const userId = "user-123";
    const playlistData = {
      id: "playlist-1",
      created_at: "2024-01-01",
      image_path: "path/to/img",
    };

    // Supabase モック
    const mockSingle = jest
      .fn()
      .mockResolvedValue({ data: playlistData, error: null });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsertSupabase = jest
      .fn()
      .mockReturnValue({ select: mockSelect });
    _supabase.from.mockReturnValue({ insert: mockInsertSupabase });

    // SQLite モック
    const mockValues = jest.fn().mockResolvedValue(undefined);
    db.insert.mockReturnValue({ values: mockValues });

    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCreatePlaylist(userId), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: "My Playlist",
        isPublic: true,
      });
    });

    // Supabase 呼び出し確認
    expect(_supabase.from).toHaveBeenCalledWith("playlists");
    expect(mockInsertSupabase).toHaveBeenCalledWith({
      user_id: userId,
      title: "My Playlist",
      is_public: true,
    });

    // SQLite 呼び出し確認
    expect(db.insert).toHaveBeenCalled();
    expect(mockValues).toHaveBeenCalledWith({
      id: "playlist-1",
      userId,
      title: "My Playlist",
      isPublic: true,
      createdAt: "2024-01-01",
      imagePath: "path/to/img",
    });

    // クエリ無効化の確認
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlists],
    });
  });

  it("ユーザーIDがない場合、エラーを投げる", async () => {
    const { result } = renderHook(() => useCreatePlaylist(undefined), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ title: "New Playlist" }),
    ).rejects.toThrow(AUTH_ERRORS.USER_ID_REQUIRED);
  });

  it("オフラインの場合、エラーを投げる", async () => {
    useNetworkStatus.mockReturnValue({ isOnline: false });

    const { result } = renderHook(() => useCreatePlaylist("user-123"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ title: "New Playlist" }),
    ).rejects.toThrow(PLAYLIST_ERRORS.OFFLINE);
  });

  it("Supabaseへの挿入に失敗した場合、エラーを投げる", async () => {
    const userId = "user-123";

    // Supabase モック (エラー)
    const mockSingle = jest.fn().mockResolvedValue({
      data: null,
      error: { message: "Internal Server Error" },
    });
    const mockSelect = jest.fn().mockReturnValue({ single: mockSingle });
    const mockInsertSupabase = jest
      .fn()
      .mockReturnValue({ select: mockSelect });
    _supabase.from.mockReturnValue({ insert: mockInsertSupabase });

    const { result } = renderHook(() => useCreatePlaylist(userId), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.mutateAsync({ title: "New Playlist" }),
    ).rejects.toThrow(
      `${PLAYLIST_ERRORS.SUPABASE_INSERT_FAILED}: Internal Server Error`,
    );

    // SQLiteには保存されないはず
    expect(db.insert).not.toHaveBeenCalled();
  });
});
