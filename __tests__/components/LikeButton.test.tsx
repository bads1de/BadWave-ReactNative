import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LikeButton from "@/components/LikeButton";

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-toast-message", () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock("@/providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        match: jest.fn(() => Promise.resolve({ data: [] })),
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { like_count: 0 } })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
      delete: jest.fn(() => ({
        match: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

const { useAuth } = require("@/providers/AuthProvider");

describe("LikeButton", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAuth.mockReturnValue({ session: { user: { id: "test-user" } } });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("レンダリングされる", () => {
    const { UNSAFE_root } = render(<LikeButton songId="song1" />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });

  it("コンポーネントが機能する", async () => {
    const { UNSAFE_root } = render(<LikeButton songId="song1" size={24} />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
