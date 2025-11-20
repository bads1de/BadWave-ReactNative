import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NextSong from "@/components/player/NextSong";
import { RepeatMode } from "react-native-track-player";

jest.mock("react-native-track-player", () => {
  return {
    RepeatMode: {
      Off: 0,
      Track: 1,
      Queue: 2,
    },
    Event: {
      PlaybackTrackChanged: "playback-track-changed",
    },
    useActiveTrack: jest.fn(),
    useTrackPlayerEvents: jest.fn(),
    TrackPlayer: {
      getTrack: jest.fn(),
    },
  };
});

jest.mock("@/hooks/usePlayerStore", () => ({
  usePlayerStore: jest.fn(),
}));

jest.mock("@/hooks/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(),
}));

jest.mock("@/components/item/SongItem", () => ({
  __esModule: true,
  default: () => null,
}));

const { usePlayerStore } = require("@/hooks/usePlayerStore");
const { useAudioPlayer } = require("@/hooks/useAudioPlayer");
const { useActiveTrack, useTrackPlayerEvents } = require("react-native-track-player");

describe("NextSong", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    usePlayerStore.mockReturnValue({
      queue: [],
      currentIndex: 0,
    });
    useAudioPlayer.mockReturnValue({
      onPlaySong: jest.fn(),
    });
    useActiveTrack.mockReturnValue({
      id: "song1",
      title: "Current Song",
    });
    useTrackPlayerEvents.mockImplementation((events: any[], callback: any) => {
       // No-op for basic render test
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(
      <NextSong repeatMode={RepeatMode.Off} shuffle={false} />,
      { wrapper }
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
