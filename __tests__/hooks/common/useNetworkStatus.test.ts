import { renderHook } from "@testing-library/react-native";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useNetworkStore } from "@/hooks/stores/useNetworkStore";

// useNetworkStore のモック
jest.mock("@/hooks/stores/useNetworkStore", () => ({
  useNetworkStore: jest.fn(),
}));

const mockUseNetworkStore = useNetworkStore as jest.MockedFunction<typeof useNetworkStore>;

describe("useNetworkStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return isOnline from useNetworkStore", () => {
    // オンライン状態をシミュレート
    mockUseNetworkStore.mockImplementation((selector: any) => 
      selector({ isOnline: true })
    );

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
  });

  it("should return isOffline when useNetworkStore says so", () => {
    // オフライン状態をシミュレート
    mockUseNetworkStore.mockImplementation((selector: any) => 
      selector({ isOnline: false })
    );

    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(false);
  });
});
