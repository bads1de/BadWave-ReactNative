import { renderHook } from "@testing-library/react";
import { useReelsPlayer } from "@/hooks/useReelsPlayer";
import { useVideoPlayer } from "expo-video";

// Mock expo-video
jest.mock("expo-video", () => ({
  useVideoPlayer: jest.fn(),
}));

describe("useReelsPlayer", () => {
  const mockPlayer = {
    play: jest.fn(),
    pause: jest.fn(),
    release: jest.fn(),
    addListener: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useVideoPlayer as jest.Mock).mockReturnValue(mockPlayer);
    mockPlayer.addListener.mockReturnValue({ remove: jest.fn() });
  });

  it("initializes player with source", () => {
    const source = "http://example.com/video.mp4";
    renderHook(() => useReelsPlayer(source, true));
    expect(useVideoPlayer).toHaveBeenCalledWith(source);
  });

  it("plays when visible", () => {
    renderHook(() => useReelsPlayer("source", true));
    expect(mockPlayer.play).toHaveBeenCalled();
  });

  it("pauses when not visible", () => {
    renderHook(() => useReelsPlayer("source", false));
    expect(mockPlayer.pause).toHaveBeenCalled();
  });

  it("calls onFinish when video ends", () => {
    const onFinish = jest.fn();
    renderHook(() => useReelsPlayer("source", true, onFinish));

    expect(mockPlayer.addListener).toHaveBeenCalledWith(
      "playToEnd",
      expect.any(Function)
    );

    // Simulate event
    const callback = mockPlayer.addListener.mock.calls[0][1];
    callback();
    expect(onFinish).toHaveBeenCalled();
  });
});
