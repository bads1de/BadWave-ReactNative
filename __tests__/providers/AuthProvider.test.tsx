import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
  },
}));

const { supabase } = require("@/lib/supabase");

describe("AuthProvider", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    supabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    supabase.auth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: { unsubscribe: jest.fn() },
      },
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  it("provides session context", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current).toHaveProperty("session");
      expect(result.current).toHaveProperty("setSession");
    });
  });

  it("initializes with null session", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.session).toBeNull();
    });
  });

  it("throws error when used outside provider", () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within a AuthProvider");
  });
});

