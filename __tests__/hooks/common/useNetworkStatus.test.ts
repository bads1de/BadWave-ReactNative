import { renderHook, act } from "@testing-library/react-native";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import NetInfo from "@react-native-community/netinfo";

// NetInfo のモック
jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn(),
  addEventListener: jest.fn(),
}));

const mockNetInfo = NetInfo as jest.Mocked<typeof NetInfo>;

describe("useNetworkStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("初期化時に NetInfo.fetch を実行し、状態を反映する", async () => {
    const mockState = { isConnected: false };
    mockNetInfo.fetch.mockResolvedValue(mockState as any);
    mockNetInfo.addEventListener.mockReturnValue(jest.fn());

    const { result } = renderHook(() => useNetworkStatus());

    await act(async () => {
      // NetInfo.fetch の完了を待つ
    });

    expect(result.current.isOnline).toBe(false);
    expect(mockNetInfo.fetch).toHaveBeenCalled();
  });

  it("ネットワーク状態の変化を検知して更新する", async () => {
    let listener: (state: any) => void = () => {};
    mockNetInfo.fetch.mockResolvedValue({ isConnected: true } as any);
    mockNetInfo.addEventListener.mockImplementation((cb: any) => {
      listener = cb;
      return jest.fn();
    });

    const { result } = renderHook(() => useNetworkStatus());

    // 初期化（fetch）の完了を待つ
    await act(async () => {});

    // 変化をシミュレート
    await act(async () => {
      listener({ isConnected: false });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("アンマウント時に購読を解除する", () => {
    const unsubscribeMock = jest.fn();
    mockNetInfo.fetch.mockResolvedValue({ isConnected: true } as any);
    mockNetInfo.addEventListener.mockReturnValue(unsubscribeMock);

    const { unmount } = renderHook(() => useNetworkStatus());
    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
