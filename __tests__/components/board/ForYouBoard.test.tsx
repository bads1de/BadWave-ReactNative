import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ForYouBoard from "@/components/board/ForYouBoard";

jest.mock("@/components/item/SongItem", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Loading", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Error", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/audio/useAudioPlayer", () => ({ useAudioPlayer: jest.fn() }));
jest.mock("@/hooks/data/useGetLocalRecommendations", () => ({
  useGetLocalRecommendations: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));
jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    session: { user: { id: "test-user-id" } },
    signOut: jest.fn(),
  })),
}));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");

describe("ForYouBoard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAudioPlayer.mockReturnValue({ onPlaySong: jest.fn() });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<ForYouBoard />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});

