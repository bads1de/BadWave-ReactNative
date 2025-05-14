import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { useHeaderStore } from "@/hooks/useHeaderStore";

describe("useHeaderStore", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      useHeaderStore.setState({ showHeader: true });
    });
  });

  it("初期状態ではヘッダーが表示される", () => {
    const { result } = renderHook(() => useHeaderStore());

    expect(result.current.showHeader).toBe(true);
  });

  it("setShowHeaderでヘッダーの表示状態を変更できる", () => {
    const { result } = renderHook(() => useHeaderStore());

    act(() => {
      result.current.setShowHeader(false);
    });

    expect(result.current.showHeader).toBe(false);

    act(() => {
      result.current.setShowHeader(true);
    });

    expect(result.current.showHeader).toBe(true);
  });

  it("複数のコンポーネントで状態が共有される", () => {
    const { result: result1 } = renderHook(() => useHeaderStore());
    const { result: result2 } = renderHook(() => useHeaderStore());

    expect(result1.current.showHeader).toBe(true);
    expect(result2.current.showHeader).toBe(true);

    act(() => {
      result1.current.setShowHeader(false);
    });

    expect(result1.current.showHeader).toBe(false);
    expect(result2.current.showHeader).toBe(false);
  });
});
