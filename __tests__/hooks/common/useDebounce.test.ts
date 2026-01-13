import { renderHook, act } from "@testing-library/react-native";
import { useDebounce } from "@/hooks/common/useDebounce";

describe("useDebounce", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("初期値を返す", () => {
    const { result } = renderHook(() => useDebounce("initial", 500));

    expect(result.current).toBe("initial");
  });

  it("遅延後に新しい値を返す", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    expect(result.current).toBe("initial");

    rerender({ value: "updated", delay: 500 });
    expect(result.current).toBe("initial"); // まだ遅延中

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated"); // 遅延後
  });

  it("遅延時間内に複数回更新された場合、最後の値のみを反映する", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "update1", delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: "update2", delay: 500 });
    act(() => {
      jest.advanceTimersByTime(200);
    });

    rerender({ value: "final", delay: 500 });
    expect(result.current).toBe("initial"); // まだ遅延中

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("final"); // 最後の値のみ反映
  });

  it("遅延時間が変更された場合、新しい遅延時間が適用される", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "initial", delay: 500 } }
    );

    rerender({ value: "updated", delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("initial"); // まだ遅延中（1000ms待ち）

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe("updated"); // 1000ms後に更新
  });

  it.skip("コンポーネントがアンマウントされた場合、タイマーがクリアされる", () => {
    const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");
    const cancelAnimationFrameSpy = jest.spyOn(global, "cancelAnimationFrame");

    const { rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: "initial" } }
    );

    // 値を更新してタイマーを開始させる
    rerender({ value: "updated" });

    // タイマーが走っている状態にする
    act(() => {
      jest.advanceTimersByTime(100);
    });

    unmount();

    const wasCleared =
      clearTimeoutSpy.mock.calls.length > 0 ||
      cancelAnimationFrameSpy.mock.calls.length > 0;
    expect(wasCleared).toBe(true);

    clearTimeoutSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });
});

