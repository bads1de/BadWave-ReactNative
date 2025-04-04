import { renderHook, act } from "@testing-library/react-hooks";
import { useAuthStore } from "../../hooks/useAuthStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    // テスト前にストアをリセット
    act(() => {
      useAuthStore.setState({ showAuthModal: false });
    });
  });

  it("初期状態では認証モーダルが非表示", () => {
    const { result } = renderHook(() => useAuthStore());
    
    expect(result.current.showAuthModal).toBe(false);
  });

  it("setShowAuthModalで認証モーダルの表示状態を変更できる", () => {
    const { result } = renderHook(() => useAuthStore());
    
    act(() => {
      result.current.setShowAuthModal(true);
    });
    
    expect(result.current.showAuthModal).toBe(true);
    
    act(() => {
      result.current.setShowAuthModal(false);
    });
    
    expect(result.current.showAuthModal).toBe(false);
  });

  it("複数のコンポーネントで状態が共有される", () => {
    const { result: result1 } = renderHook(() => useAuthStore());
    const { result: result2 } = renderHook(() => useAuthStore());
    
    expect(result1.current.showAuthModal).toBe(false);
    expect(result2.current.showAuthModal).toBe(false);
    
    act(() => {
      result1.current.setShowAuthModal(true);
    });
    
    expect(result1.current.showAuthModal).toBe(true);
    expect(result2.current.showAuthModal).toBe(true);
  });
});
