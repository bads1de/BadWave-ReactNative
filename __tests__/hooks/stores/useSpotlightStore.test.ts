import { renderHook, act } from "@testing-library/react-native";
import { useSpotlightStore } from "@/hooks/stores/useSpotlightStore";

describe("useSpotlightStore", () => {
  beforeEach(() => {
    useSpotlightStore.setState({ visibleIndex: 0 });
  });

  it("should have default visibleIndex as 0", () => {
    const { result } = renderHook(() => useSpotlightStore());
    expect(result.current.visibleIndex).toBe(0);
  });

  it("should set visibleIndex", () => {
    const { result } = renderHook(() => useSpotlightStore());

    act(() => {
      result.current.setVisibleIndex(5);
    });

    expect(result.current.visibleIndex).toBe(5);
  });

  it("should set visibleIndex to null", () => {
    const { result } = renderHook(() => useSpotlightStore());

    act(() => {
      result.current.setVisibleIndex(null);
    });

    expect(result.current.visibleIndex).toBeNull();
  });
});
