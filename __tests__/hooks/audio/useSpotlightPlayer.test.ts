import { renderHook } from "@testing-library/react";
import { useSpotlightPlayer } from "@/hooks/audio/useSpotlightPlayer";
import { useVideoPlayer } from "expo-video";

// Mock expo-video
jest.mock("expo-video", () => ({
  useVideoPlayer: jest.fn(),
}));

describe("useSpotlightPlayer", () => {
  const mockPlayer = {
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useVideoPlayer as jest.Mock).mockReturnValue(mockPlayer);
  });

  it("initializes player with source and sets loop", () => {
    const source = "http://example.com/video.mp4";
    // Setup function is passed as 2nd arg
    renderHook(() => useSpotlightPlayer(source, true));

    expect(useVideoPlayer).toHaveBeenCalledWith(source, expect.any(Function));

    // Call the setup function to verify it sets loop
    const setupFn = (useVideoPlayer as jest.Mock).mock.calls[0][1];
    const testPlayer = { loop: false, pause: jest.fn() };
    setupFn(testPlayer);
    expect(testPlayer.loop).toBe(true);
  });

  it("plays when visible", () => {
    renderHook(() => useSpotlightPlayer("source", true));
    expect(mockPlayer.play).toHaveBeenCalled();
  });

  it("pauses when not visible", () => {
    renderHook(() => useSpotlightPlayer("source", false));
    expect(mockPlayer.pause).toHaveBeenCalled();
  });
});

