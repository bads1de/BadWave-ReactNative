import React from "react";
import { renderHook, act } from "@testing-library/react-native";
import { SyncProvider, useSync } from "@/providers/SyncProvider";
import { storage } from "@/lib/storage/mmkv-storage";
import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useSyncSongs } from "@/hooks/sync/useSyncSongs";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";
import { useSyncTrendSongs } from "@/hooks/sync/useSyncTrendSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncSpotlights } from "@/hooks/sync/useSyncSpotlights";
import { SYNC_STORAGE_KEY } from "@/constants";
import { AppState, AppStateStatus } from "react-native";
import { focusManager } from "@tanstack/react-query";

// Mocks
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  focusManager: {
    setFocused: jest.fn(),
  },
}));

jest.mock("@/providers/AuthProvider");
jest.mock("@/hooks/common/useNetworkStatus");
jest.mock("@/hooks/sync/useSyncSongs");
jest.mock("@/hooks/sync/useSyncLikedSongs");
jest.mock("@/hooks/sync/useSyncPlaylists");
jest.mock("@/hooks/sync/useSyncTrendSongs");
jest.mock("@/hooks/sync/useSyncRecommendations");
jest.mock("@/hooks/sync/useSyncSpotlights");
jest.mock("@/lib/storage/mmkv-storage", () => ({
  storage: {
    getString: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockTriggerSync = jest.fn();

describe("SyncProvider", () => {
  let appStateCallback: ((state: AppStateStatus) => void) | null = null;
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: "test-user" } },
    });
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });

    const defaultSyncHook = {
      isSyncing: false,
      syncError: null,
      triggerSync: mockTriggerSync,
    };

    (useSyncSongs as jest.Mock).mockReturnValue(defaultSyncHook);
    (useSyncLikedSongs as jest.Mock).mockReturnValue(defaultSyncHook);
    (useSyncPlaylists as jest.Mock).mockReturnValue(defaultSyncHook);
    (useSyncTrendSongs as jest.Mock).mockReturnValue(defaultSyncHook);
    (useSyncRecommendations as jest.Mock).mockReturnValue(defaultSyncHook);
    (useSyncSpotlights as jest.Mock).mockReturnValue(defaultSyncHook);

    jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_, callback) => {
        appStateCallback = callback;
        return { remove: jest.fn() } as any;
      });
    Object.defineProperty(AppState, "currentState", {
      value: "active",
      writable: true,
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SyncProvider>{children}</SyncProvider>
  );

  it("should load initial lastSyncTime from storage", () => {
    const mockDate = "2023-01-01T00:00:00.000Z";
    (storage.getString as jest.Mock).mockReturnValue(mockDate);

    const { result } = renderHook(() => useSync(), { wrapper });

    expect(result.current.lastSyncTime).toEqual(new Date(mockDate));
    expect(storage.getString).toHaveBeenCalledWith(SYNC_STORAGE_KEY);
  });

  it("should update lastSyncTime and save to storage after sync completion", async () => {
    (storage.getString as jest.Mock).mockReturnValue(null);
    let isSyncingStatus = false;

    // mock internal hook to use local status
    (useSyncSongs as jest.Mock).mockImplementation(() => ({
      isSyncing: isSyncingStatus,
      syncError: null,
      triggerSync: mockTriggerSync,
    }));

    const { result, rerender } = renderHook(() => useSync(), { wrapper });

    expect(result.current.lastSyncTime).toBeNull();

    await act(async () => {
      result.current.triggerSync();
    });

    expect(mockTriggerSync).toHaveBeenCalled();

    // Simulate starting sync
    isSyncingStatus = true;
    rerender({});
    expect(result.current.isSyncing).toBe(true);
    expect(result.current.lastSyncTime).toBeNull();

    // Simulate finishing sync
    await act(async () => {
      isSyncingStatus = false;
      rerender({});
    });

    expect(result.current.isSyncing).toBe(false);
    expect(result.current.lastSyncTime).toBeInstanceOf(Date);
    expect(storage.set).toHaveBeenCalledWith(
      SYNC_STORAGE_KEY,
      expect.any(String),
    );
  });

  it("should not trigger sync if offline", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    const { result } = renderHook(() => useSync(), { wrapper });

    act(() => {
      result.current.triggerSync();
    });

    expect(mockTriggerSync).not.toHaveBeenCalled();
  });

  it("should not trigger sync if AppState is not active", async () => {
    Object.defineProperty(AppState, "currentState", {
      value: "background",
      writable: true,
    });
    const { result } = renderHook(() => useSync(), { wrapper });

    await act(async () => {
      result.current.triggerSync();
    });

    expect(mockTriggerSync).not.toHaveBeenCalled();
  });

  it("should set react-query focusManager dynamically via AppState listener", () => {
    // 最初のマウント時に active => background への切り替えをシミュレート
    renderHook(() => useSync(), { wrapper });

    act(() => {
      if (appStateCallback) appStateCallback("background");
    });
    expect(focusManager.setFocused).toHaveBeenCalledWith(false);

    act(() => {
      if (appStateCallback) appStateCallback("active");
    });
    expect(focusManager.setFocused).toHaveBeenCalledWith(true);
  });
});
