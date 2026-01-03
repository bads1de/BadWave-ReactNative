import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useStorageInfo } from "@/hooks/useStorageInfo";
import { getOfflineStorageService } from "@/hooks/TrackPlayer/utils";

// モックの設定
jest.mock("@/hooks/TrackPlayer/utils", () => ({
  getOfflineStorageService: jest.fn(),
}));

describe("useStorageInfo", () => {
  let queryClient: QueryClient;
  const mockOfflineStorageService = {
    getDownloadedSongsSize: jest.fn(),
    getDownloadedSongs: jest.fn(),
    clearAllDownloads: jest.fn(),
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    (getOfflineStorageService as jest.Mock).mockReturnValue(
      mockOfflineStorageService
    );
  });

  afterEach(() => {
    queryClient.clear();
  });

  it("should fetch storage info on mount", async () => {
    mockOfflineStorageService.getDownloadedSongsSize.mockResolvedValue(5000000);
    mockOfflineStorageService.getDownloadedSongs.mockResolvedValue([
      { id: "1" },
      { id: "2" },
      { id: "3" },
    ]);

    const { result } = renderHook(() => useStorageInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.downloadedSize).toBe(5000000);
    expect(result.current.downloadedCount).toBe(3);
    expect(result.current.error).toBeNull();
  });

  it("should return 0 when no songs are downloaded", async () => {
    mockOfflineStorageService.getDownloadedSongsSize.mockResolvedValue(0);
    mockOfflineStorageService.getDownloadedSongs.mockResolvedValue([]);

    const { result } = renderHook(() => useStorageInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.downloadedSize).toBe(0);
    expect(result.current.downloadedCount).toBe(0);
  });

  it("should call deleteAllDownloads directly", async () => {
    mockOfflineStorageService.getDownloadedSongsSize.mockResolvedValue(5000000);
    mockOfflineStorageService.getDownloadedSongs.mockResolvedValue([
      { id: "1" },
    ]);
    mockOfflineStorageService.clearAllDownloads.mockResolvedValue({
      success: true,
    });

    const { result } = renderHook(() => useStorageInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteAllDownloads();
    });

    expect(mockOfflineStorageService.clearAllDownloads).toHaveBeenCalled();
  });

  it("should clear query cache when clearQueryCache is called", async () => {
    mockOfflineStorageService.getDownloadedSongsSize.mockResolvedValue(0);
    mockOfflineStorageService.getDownloadedSongs.mockResolvedValue([]);

    const clearSpy = jest.spyOn(queryClient, "clear");

    const { result } = renderHook(() => useStorageInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    act(() => {
      result.current.clearQueryCache();
    });

    expect(clearSpy).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    mockOfflineStorageService.getDownloadedSongsSize.mockRejectedValue(
      new Error("Failed to get size")
    );
    mockOfflineStorageService.getDownloadedSongs.mockRejectedValue(
      new Error("Failed to get songs")
    );

    const { result } = renderHook(() => useStorageInfo(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
  });
});
