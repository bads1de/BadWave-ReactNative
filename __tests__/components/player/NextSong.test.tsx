import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NextSong from "@/components/player/NextSong";

jest.mock("@rntp/player", () => {
  return {
    RepeatMode: {
      Off: "off",
      One: "one",
      All: "all",
    },
    useActiveMediaItem: jest.fn(),
    getQueue: jest.fn(() => []),
    getActiveMediaItemIndex: jest.fn(() => null),
  };
});

jest.mock("@/hooks/stores/usePlayerStore", () => ({
  usePlayerStore: jest.fn(),
}));

jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(),
  useIsPlaying: jest.fn(() => false),
}));

jest.mock("@/hooks/stores/useAudioStore", () => ({
  useAudioStore: jest.fn((selector) =>
    selector({
      repeatMode: "off",
      shuffle: false,
      currentSong: null,
    }),
  ),
}));

jest.mock("@/components/item/SongItem", () => ({
  __esModule: true,
  default: () => null,
}));

const { usePlayerStore } = require("@/hooks/stores/usePlayerStore");
const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");
const { useAudioStore } = require("@/hooks/stores/useAudioStore");
const { useActiveMediaItem } = require("@rntp/player");

describe("NextSong", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    usePlayerStore.mockReturnValue({
      queue: [],
      currentIndex: 0,
    });
    useAudioPlayer.mockReturnValue({
      onPlaySong: jest.fn(),
    });
    useActiveMediaItem.mockReturnValue({
      mediaId: "song1",
      title: "Current Song",
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<NextSong />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
