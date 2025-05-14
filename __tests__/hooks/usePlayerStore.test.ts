import { renderHook } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import { usePlayerStore } from "@/hooks/usePlayerStore";

describe("usePlayerStore", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      usePlayerStore.setState({ showPlayer: false });
    });
  });

  it("初期状態ではプレイヤーが非表示", () => {
    const { result } = renderHook(() => usePlayerStore());

    expect(result.current.showPlayer).toBe(false);
  });

  it("setShowPlayerでプレイヤーの表示状態を変更できる", () => {
    const { result } = renderHook(() => usePlayerStore());

    act(() => {
      result.current.setShowPlayer(true);
    });

    expect(result.current.showPlayer).toBe(true);

    act(() => {
      result.current.setShowPlayer(false);
    });

    expect(result.current.showPlayer).toBe(false);
  });

  it("複数のコンポーネントで状態が共有される", () => {
    const { result: result1 } = renderHook(() => usePlayerStore());
    const { result: result2 } = renderHook(() => usePlayerStore());

    expect(result1.current.showPlayer).toBe(false);
    expect(result2.current.showPlayer).toBe(false);

    act(() => {
      result1.current.setShowPlayer(true);
    });

    expect(result1.current.showPlayer).toBe(true);
    expect(result2.current.showPlayer).toBe(true);
  });
});
