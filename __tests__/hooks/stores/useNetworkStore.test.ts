import { renderHook, act } from "@testing-library/react-native";
import { useNetworkStore } from "@/hooks/stores/useNetworkStore";

jest.mock("@react-native-community/netinfo", () => ({
  fetch: jest.fn().mockResolvedValue({ isConnected: true }),
  addEventListener: jest.fn(() => jest.fn()),
}));

describe("useNetworkStore", () => {
  beforeEach(() => {
    useNetworkStore.setState({
      isOnline: true,
      _initialized: false,
    });
  });

  it("should have default isOnline as true", () => {
    const { result } = renderHook(() => useNetworkStore());
    expect(result.current.isOnline).toBe(true);
  });

  it("should set isOnline", () => {
    const { result } = renderHook(() => useNetworkStore());

    act(() => {
      useNetworkStore.setState({ isOnline: false });
    });

    expect(result.current.isOnline).toBe(false);
  });

  it("should initialize only once", () => {
    const { result } = renderHook(() => useNetworkStore());

    act(() => {
      result.current._init();
    });

    expect(result.current._initialized).toBe(true);
  });

  it("should not re-initialize if already initialized", () => {
    useNetworkStore.setState({ _initialized: true });

    const { result } = renderHook(() => useNetworkStore());
    const unsubscribe = result.current._init();

    expect(typeof unsubscribe).toBe("function");
  });
});
