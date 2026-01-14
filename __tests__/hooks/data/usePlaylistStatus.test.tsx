import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import usePlaylistStatus from "@/hooks/data/usePlaylistStatus";
import getSongPlaylistStatus from "@/actions/playlist/getSongPlaylistStatus";
import { useAuth } from "@/providers/AuthProvider";

// モックの定義
jest.mock("@/actions/playlist/getSongPlaylistStatus");
jest.mock("@/providers/AuthProvider");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("usePlaylistStatus", () => {
  const playlists = [
    {
      id: "p1",
      title: "Playlist 1",
      user_id: "u1",
      is_public: true,
      created_at: "",
    },
    {
      id: "p2",
      title: "Playlist 2",
      user_id: "u1",
      is_public: false,
      created_at: "",
    },
  ];
  const songId = "s1";

  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: "user-123" } },
    });
  });

  it("正常にプレイリストの追加状態を取得し、マッピングできる", async () => {
    // getSongPlaylistStatus が "p1" に含まれていることを返すように設定
    (getSongPlaylistStatus as jest.Mock).mockResolvedValue(["p1"]);

    const { result } = renderHook(
      () => usePlaylistStatus({ songId, playlists }),
      {
        wrapper: createWrapper(),
      }
    );

    // 読み込み完了を待機
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // データが正しくマッピングされていることを確認
    expect(result.current.data).toEqual({
      p1: true,
      p2: false,
    });
    expect(getSongPlaylistStatus).toHaveBeenCalledWith(songId);
  });

  it("未認証の場合は query が enabled にならない、または空を返す", async () => {
    (useAuth as jest.Mock).mockReturnValue({ session: null });

    const { result } = renderHook(
      () => usePlaylistStatus({ songId, playlists }),
      {
        wrapper: createWrapper(),
      }
    );

    // enabled: false の場合、status は 'pending' (isLoading: true) のままか、fetch されない
    expect(getSongPlaylistStatus).not.toHaveBeenCalled();
  });
});

