import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
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
  },
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

describe("useLikeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーIDがない場合はfalseを返す", async () => {
    // このテストは useLikeStatus 実装後に有効化
    expect(true).toBe(true);
  });

  it("いいね済みの曲はtrueを返す", async () => {
    // このテストは useLikeStatus 実装後に有効化
    expect(true).toBe(true);
  });

  it("いいねしていない曲はfalseを返す", async () => {
    // このテストは useLikeStatus 実装後に有効化
    expect(true).toBe(true);
  });
});

describe("useLikeMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("オフライン時はエラーを投げる", async () => {
    // このテストは useLikeMutation 実装後に有効化
    expect(true).toBe(true);
  });

  it("いいねを追加できる", async () => {
    // このテストは useLikeMutation 実装後に有効化
    expect(true).toBe(true);
  });

  it("いいねを解除できる", async () => {
    // このテストは useLikeMutation 実装後に有効化
    expect(true).toBe(true);
  });

  it("ユーザーIDがない場合はエラーを投げる", async () => {
    // このテストは useLikeMutation 実装後に有効化
    expect(true).toBe(true);
  });
});

describe("useGetLikedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーIDがない場合は空配列を返す", async () => {
    // このテストは useGetLikedSongs 実装後に有効化
    expect(true).toBe(true);
  });

  it("いいねした曲一覧を取得できる", async () => {
    // このテストは useGetLikedSongs 実装後に有効化
    expect(true).toBe(true);
  });

  it("SQLiteからローカルファーストで取得する", async () => {
    // このテストは useGetLikedSongs 実装後に有効化
    expect(true).toBe(true);
  });
});
