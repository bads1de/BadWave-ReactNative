import { renderHook } from "@testing-library/react-native";
import { useSyncBase } from "@/hooks/sync/useSyncBase";

import { useQuery } from "@tanstack/react-query";

const mockInvalidateQueries = jest.fn();
const mockRefetch = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    invalidateQueries: mockInvalidateQueries,
  })),
}));

describe("useSyncBase", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return syncedCount as 0 when no data", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() =>
      useSyncBase({
        queryKey: ["sync", "songs"],
        queryFn: jest.fn(),
        invalidateQueryKey: ["songs"],
      })
    );

    expect(result.current.syncedCount).toBe(0);
  });

  it("should return isSyncing from isFetching", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: true,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() =>
      useSyncBase({
        queryKey: ["sync", "songs"],
        queryFn: jest.fn(),
        invalidateQueryKey: ["songs"],
      })
    );

    expect(result.current.isSyncing).toBe(true);
  });

  it("should return syncError from error", () => {
    const mockError = new Error("Sync failed");
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
      error: mockError,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() =>
      useSyncBase({
        queryKey: ["sync", "songs"],
        queryFn: jest.fn(),
        invalidateQueryKey: ["songs"],
      })
    );

    expect(result.current.syncError).toBe(mockError);
  });

  it("should call triggerSync which maps to refetch", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() =>
      useSyncBase({
        queryKey: ["sync", "songs"],
        queryFn: jest.fn(),
        invalidateQueryKey: ["songs"],
      })
    );

    result.current.triggerSync();
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("should pass enabled option to useQuery", () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isFetching: false,
      error: null,
      refetch: mockRefetch,
    });

    renderHook(() =>
      useSyncBase({
        queryKey: ["sync", "songs"],
        queryFn: jest.fn(),
        invalidateQueryKey: ["songs"],
        enabled: true,
      })
    );

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: true,
      })
    );
  });
});
