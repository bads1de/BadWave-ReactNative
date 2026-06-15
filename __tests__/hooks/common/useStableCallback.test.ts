import { renderHook, act } from "@testing-library/react-native";
import { useStableCallback } from "@/hooks/common/useStableCallback";

describe("useStableCallback", () => {
  it("コールバック関数を返す", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useStableCallback(callback));

    expect(typeof result.current).toBe("function");
  });

  it("返された関数を呼び出すと元のコールバックが実行される", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useStableCallback(callback));

    act(() => {
      result.current("arg1", "arg2");
    });

    expect(callback).toHaveBeenCalledWith("arg1", "arg2");
  });

  it("callbackが変わっても返された関数の参照は変わらない", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useStableCallback(cb),
      { initialProps: { cb: callback1 } }
    );

    const firstRef = result.current;

    rerender({ cb: callback2 });

    expect(result.current).toBe(firstRef);
  });

  it("callbackが変わっても、新しいcallbackが呼ばれる", () => {
    const callback1 = jest.fn();
    const callback2 = jest.fn();

    const { result, rerender } = renderHook(
      ({ cb }) => useStableCallback(cb),
      { initialProps: { cb: callback1 } }
    );

    rerender({ cb: callback2 });

    act(() => {
      result.current();
    });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it("複数回呼び出しても正しく動作する", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useStableCallback(callback));

    act(() => {
      result.current("first");
      result.current("second");
      result.current("third");
    });

    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenNthCalledWith(1, "first");
    expect(callback).toHaveBeenNthCalledWith(2, "second");
    expect(callback).toHaveBeenNthCalledWith(3, "third");
  });

  it("引数なしのコールバックでも正しく動作する", () => {
    const callback = jest.fn();
    const { result } = renderHook(() => useStableCallback(callback));

    act(() => {
      result.current();
    });

    expect(callback).toHaveBeenCalledWith();
  });

  it("戻り値があるコールバックでも正しく動作する", () => {
    const callback = jest.fn().mockReturnValue(42);
    const { result } = renderHook(() => useStableCallback(callback));

    let returnValue: number;
    act(() => {
      returnValue = result.current();
    });

    expect(returnValue!).toBe(42);
  });
});
