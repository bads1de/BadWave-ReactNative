import { renderHook, act } from "@testing-library/react-native";
import { useOfflineGuard } from "@/hooks/common/useOfflineGuard";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { Alert } from "react-native";

// モック
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

// Alert.alert のモック
jest.spyOn(Alert, "alert");

const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

describe("useOfflineGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("guardAction", () => {
    it("オンライン時: action が実行される", async () => {
      mockUseNetworkStatus.mockReturnValue({ isOnline: true });
      const mockAction = jest.fn();

      const { result } = renderHook(() => useOfflineGuard());
      const guarded = result.current.guardAction(mockAction);

      await act(async () => {
        await guarded("arg1");
      });

      expect(mockAction).toHaveBeenCalledWith("arg1");
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("オフライン時: action は実行されず、Alertが表示される", async () => {
      mockUseNetworkStatus.mockReturnValue({ isOnline: false });
      const mockAction = jest.fn();

      const { result } = renderHook(() => useOfflineGuard());
      const guarded = result.current.guardAction(
        mockAction,
        "Custom Offline Message",
      );

      await act(async () => {
        await guarded();
      });

      expect(mockAction).not.toHaveBeenCalled();
      expect(Alert.alert).toHaveBeenCalledWith(
        "オフラインです",
        "Custom Offline Message",
        expect.any(Array),
      );
    });
  });

  describe("checkOnline", () => {
    it("オンライン時: true を返す", () => {
      mockUseNetworkStatus.mockReturnValue({ isOnline: true });
      const { result } = renderHook(() => useOfflineGuard());

      const isOnline = result.current.checkOnline();
      expect(isOnline).toBe(true);
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    it("オフライン時: false を返し、デフォルトでAlertを表示する", () => {
      mockUseNetworkStatus.mockReturnValue({ isOnline: false });
      const { result } = renderHook(() => useOfflineGuard());

      const isOnline = result.current.checkOnline();
      expect(isOnline).toBe(false);
      expect(Alert.alert).toHaveBeenCalled();
    });

    it("オフライン時でも showAlert=false なら Alert を表示しない", () => {
      mockUseNetworkStatus.mockReturnValue({ isOnline: false });
      const { result } = renderHook(() => useOfflineGuard());

      const isOnline = result.current.checkOnline(false);
      expect(isOnline).toBe(false);
      expect(Alert.alert).not.toHaveBeenCalled();
    });
  });
});
