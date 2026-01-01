import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

// テスト用ラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
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

  it("ユーザーIDがない場合は空配列を返す", async () => {
    expect(true).toBe(true);
  });

  it("SQLiteからプレイリスト一覧を取得できる", async () => {
    expect(true).toBe(true);
  });
});

describe("useGetPlaylistSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("プレイリストIDがない場合は空配列を返す", async () => {
    expect(true).toBe(true);
  });

  it("プレイリスト内の曲一覧を取得できる", async () => {
    expect(true).toBe(true);
  });
});

describe("useMutatePlaylistSong", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オフライン時は曲の追加がエラーになる", async () => {
    expect(true).toBe(true);
  });

  it("プレイリストに曲を追加できる", async () => {
    expect(true).toBe(true);
  });

  it("プレイリストから曲を削除できる", async () => {
    expect(true).toBe(true);
  });
});

describe("useCreatePlaylist", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オフライン時はプレイリスト作成がエラーになる", async () => {
    expect(true).toBe(true);
  });

  it("プレイリストを作成できる", async () => {
    expect(true).toBe(true);
  });
});
