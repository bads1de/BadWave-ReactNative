import React from "react";
import { render } from "@testing-library/react-native";
import { Text } from "react-native";
import { QueryProvider, queryClient } from "@/providers/QueryProvider";
import { onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";

// モック
jest.mock("@tanstack/react-query-persist-client", () => ({
  PersistQueryClientProvider: jest.fn(({ children }) => <>{children}</>),
}));

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    onlineManager: {
      isOnline: jest.fn(),
    },
    // QueryClient はそのままでも良い（プロトタイプをスパイする）
  };
});

jest.mock("@/lib/storage/mmkv-persister", () => ({
  mmkvPersister: {},
}));

jest.mock("@/constants", () => ({
  CACHE_CONFIG: {
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
  },
}));

describe("QueryProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("子要素を正しくレンダリングすること", () => {
    const { getByText } = render(
      <QueryProvider>
        <Text>Test Child</Text>
      </QueryProvider>
    );
    expect(getByText("Test Child")).toBeTruthy();
  });

  it("PersistQueryClientProvider に正しいプロップスを渡すこと", () => {
    render(
      <QueryProvider>
        <Text>Test Child</Text>
      </QueryProvider>
    );

    expect(PersistQueryClientProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        client: queryClient,
        persistOptions: expect.objectContaining({
          maxAge: 1000 * 60 * 60 * 24,
        }),
      }),
      expect.anything()
    );
  });

  it("オンライン時に onSuccess が呼ばれると、ミューテーションを再開しクエリを無効化すること", async () => {
    (onlineManager.isOnline as jest.Mock).mockReturnValue(true);

    // queryClient のメソッドをスパイ
    const resumeSpy = jest
      .spyOn(queryClient, "resumePausedMutations")
      .mockResolvedValue();
    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    render(
      <QueryProvider>
        <Text>Test Child</Text>
      </QueryProvider>
    );

    // PersistQueryClientProvider の props から onSuccess を取得して実行
    const { onSuccess } = (PersistQueryClientProvider as jest.Mock).mock
      .calls[0][0];
    await onSuccess();

    expect(resumeSpy).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalled();

    resumeSpy.mockRestore();
    invalidateSpy.mockRestore();
  });

  it("オフライン時に onSuccess が呼ばれても、クエリの更新を行わないこと", async () => {
    (onlineManager.isOnline as jest.Mock).mockReturnValue(false);

    const resumeSpy = jest
      .spyOn(queryClient, "resumePausedMutations")
      .mockResolvedValue();
    const invalidateSpy = jest
      .spyOn(queryClient, "invalidateQueries")
      .mockResolvedValue();

    render(
      <QueryProvider>
        <Text>Test Child</Text>
      </QueryProvider>
    );

    const { onSuccess } = (PersistQueryClientProvider as jest.Mock).mock
      .calls[0][0];
    await onSuccess();

    expect(resumeSpy).not.toHaveBeenCalled();
    expect(invalidateSpy).not.toHaveBeenCalled();

    resumeSpy.mockRestore();
    invalidateSpy.mockRestore();
  });
});

