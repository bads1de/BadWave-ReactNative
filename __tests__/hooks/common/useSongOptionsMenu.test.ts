import { renderHook, act } from "@testing-library/react-native";
import { useSongOptionsMenu } from "@/hooks/common/useSongOptionsMenu";

describe("useSongOptionsMenu", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should have default state", () => {
    const { result } = renderHook(() => useSongOptionsMenu());

    expect(result.current.selectedSong).toBeNull();
    expect(result.current.isSongOptionsVisible).toBe(false);
  });

  it("should open song options with delay", () => {
    const { result } = renderHook(() => useSongOptionsMenu());
    const mockSong = { id: "1", title: "Test Song" } as any;

    act(() => {
      result.current.openSongOptions(mockSong);
    });

    expect(result.current.selectedSong).toEqual(mockSong);
    expect(result.current.isSongOptionsVisible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(result.current.isSongOptionsVisible).toBe(true);
  });

  it("should close song options with delay", () => {
    const { result } = renderHook(() => useSongOptionsMenu());
    const mockSong = { id: "1", title: "Test Song" } as any;

    act(() => {
      result.current.openSongOptions(mockSong);
    });

    act(() => {
      jest.advanceTimersByTime(10);
    });

    expect(result.current.isSongOptionsVisible).toBe(true);

    act(() => {
      result.current.closeSongOptions();
    });

    expect(result.current.isSongOptionsVisible).toBe(false);

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(result.current.selectedSong).toBeNull();
  });

  it("should clear timeouts on cleanup", () => {
    const { result, unmount } = renderHook(() => useSongOptionsMenu());
    const mockSong = { id: "1", title: "Test Song" } as any;

    act(() => {
      result.current.openSongOptions(mockSong);
    });

    unmount();

    expect(() => {
      jest.advanceTimersByTime(500);
    }).not.toThrow();
  });
});
