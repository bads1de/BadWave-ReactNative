import { renderHook, act } from "@testing-library/react-native";
import { useSearchScreen } from "@/hooks/common/useSearchScreen";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

jest.mock("@/actions/song/getSongsByTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/actions/playlist/getPlaylistsByTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  usePlayControls: jest.fn(() => ({
    togglePlayPause: jest.fn(),
  })),
}));

jest.mock("@/hooks/stores/useSearchHistoryStore", () => ({
  useSearchHistoryStore: jest.fn((selector) => {
    const state = {
      history: [],
      addQuery: jest.fn(),
      removeQuery: jest.fn(),
      clearHistory: jest.fn(),
      loadHistory: jest.fn(),
    };
    return selector(state);
  }),
}));

jest.mock("@/hooks/common/useStableCallback", () => ({
  useStableCallback: (fn: any) => fn,
}));

describe("useSearchScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should have default state", () => {
    const { result } = renderHook(() => useSearchScreen());

    expect(result.current.rawQuery).toBe("");
    expect(result.current.debouncedQuery).toBe("");
    expect(result.current.searchType).toBe("songs");
    expect(result.current.songs).toEqual([]);
    expect(result.current.playlists).toEqual([]);
  });

  it("should update rawQuery", () => {
    const { result } = renderHook(() => useSearchScreen());

    act(() => {
      result.current.setRawQuery("test query");
    });

    expect(result.current.rawQuery).toBe("test query");
  });

  it("should update debouncedQuery", () => {
    const { result } = renderHook(() => useSearchScreen());

    act(() => {
      result.current.setDebouncedQuery("debounced");
    });

    expect(result.current.debouncedQuery).toBe("debounced");
  });

  it("should update searchType", () => {
    const { result } = renderHook(() => useSearchScreen());

    act(() => {
      result.current.setSearchType("playlists");
    });

    expect(result.current.searchType).toBe("playlists");
  });

  it("should compute showHistory correctly", () => {
    const { result } = renderHook(() => useSearchScreen());

    // rawQuery is empty, history is empty
    expect(result.current.showHistory).toBe(false);
  });

  it("should compute showEmptyState correctly", () => {
    const { result } = renderHook(() => useSearchScreen());

    // debouncedQuery is empty
    expect(result.current.showEmptyState).toBe(false);
  });
});
