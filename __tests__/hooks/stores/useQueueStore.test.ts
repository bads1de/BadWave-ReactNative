import { renderHook, act } from "@testing-library/react-native";
import { useQueueStore } from "@/hooks/audio/TrackPlayer/useQueueStore";

describe("useQueueStore", () => {
  beforeEach(() => {
    useQueueStore.setState({
      isShuffleEnabled: false,
      originalQueue: [],
      currentQueue: [],
      lastProcessedTrackId: null,
      currentSongId: null,
      context: { type: null },
    });
  });

  it("should have default state", () => {
    const { result } = renderHook(() => useQueueStore());

    expect(result.current.isShuffleEnabled).toBe(false);
    expect(result.current.originalQueue).toEqual([]);
    expect(result.current.currentQueue).toEqual([]);
    expect(result.current.currentSongId).toBeNull();
    expect(result.current.context).toEqual({ type: null });
  });

  it("should update state with setQueueState", () => {
    const { result } = renderHook(() => useQueueStore());

    act(() => {
      result.current.setQueueState(() => ({
        isShuffleEnabled: true,
        currentSongId: "song-1",
      }));
    });

    expect(result.current.isShuffleEnabled).toBe(true);
    expect(result.current.currentSongId).toBe("song-1");
  });

  it("should reset state with resetQueueState", () => {
    const { result } = renderHook(() => useQueueStore());

    act(() => {
      result.current.setQueueState(() => ({
        isShuffleEnabled: true,
        currentSongId: "song-1",
        originalQueue: [{ id: "1" } as any],
        currentQueue: [{ id: "1" } as any],
      }));
    });

    act(() => {
      result.current.resetQueueState();
    });

    expect(result.current.isShuffleEnabled).toBe(false);
    expect(result.current.currentSongId).toBeNull();
    expect(result.current.originalQueue).toEqual([]);
    expect(result.current.currentQueue).toEqual([]);
  });

  it("should not update if same currentSongId is set", () => {
    useQueueStore.setState({ currentSongId: "song-1" });

    const { result } = renderHook(() => useQueueStore());

    act(() => {
      result.current.setQueueState(() => ({
        currentSongId: "song-1",
      }));
    });

    expect(result.current.currentSongId).toBe("song-1");
  });

  it("should update context", () => {
    const { result } = renderHook(() => useQueueStore());

    act(() => {
      result.current.setQueueState(() => ({
        context: { type: "search", query: "test" },
      }));
    });

    expect(result.current.context).toEqual({ type: "search", query: "test" });
  });
});
