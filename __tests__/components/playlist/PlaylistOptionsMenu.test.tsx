import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PlaylistOptionsMenu from "@/components/playlist/PlaylistOptionsMenu";
import { useAuth } from "@/providers/AuthProvider";

// Mock dependencies
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: "medium", Light: "light" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockIcon = (props: any) => React.createElement(View, props);
  return {
    Settings2: MockIcon,
    Edit3: MockIcon,
    Globe: MockIcon,
    Lock: MockIcon,
    Trash2: MockIcon,
    Download: MockIcon,
    Check: MockIcon,
    X: MockIcon,
    ChevronRight: MockIcon,
  };
});

// expo-routerのモック
const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// react-native-toast-messageのモック
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

// AuthProviderのモック
jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

// useNetworkStatusのモック
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

// useBulkDownloadのモック
jest.mock("@/hooks/downloads/useBulkDownload", () => ({
  useBulkDownload: jest.fn(() => ({
    status: "none",
    progress: 0,
    startDownload: jest.fn(),
    startDelete: jest.fn(),
    cancel: jest.fn(),
    error: null,
    downloadedCount: 0,
    isDownloading: false,
  })),
}));

// action関数のモック
jest.mock("@/actions/playlist/deletePlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/actions/playlist/renamePlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/actions/playlist/togglePublicPlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// CustomAlertDialogのモック
jest.mock("@/components/common/CustomAlertDialog", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ visible, onConfirm, onCancel }: any) =>
      visible
        ? React.createElement(
            require("react-native").View,
            { testID: "alert-dialog" },
            [
              React.createElement(
                require("react-native").TouchableOpacity,
                {
                  testID: "confirm-button",
                  onPress: onConfirm,
                  key: "confirm",
                },
                React.createElement(
                  require("react-native").Text,
                  null,
                  "delete",
                ),
              ),
              React.createElement(
                require("react-native").TouchableOpacity,
                { testID: "cancel-button", onPress: onCancel, key: "cancel" },
                React.createElement(
                  require("react-native").Text,
                  null,
                  "cancel",
                ),
              ),
            ],
          )
        : null,
  };
});

const Toast = require("react-native-toast-message").default;
const deletePlaylist = require("@/actions/playlist/deletePlaylist").default;
const renamePlaylist = require("@/actions/playlist/renamePlaylist").default;
const togglePublicPlaylist =
  require("@/actions/playlist/togglePublicPlaylist").default;

describe("PlaylistOptionsMenu", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    deletePlaylist.mockResolvedValue(undefined);
    renamePlaylist.mockResolvedValue(undefined);
    togglePublicPlaylist.mockResolvedValue(undefined);
    mockPush.mockClear();

    // デフォルトのセッション設定
    (useAuth as jest.Mock).mockReturnValue({
      session: {
        user: { id: "user1" },
        access_token: "token",
        refresh_token: "refresh",
      },
      setSession: jest.fn(),
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe("レンダリングテスト", () => {
    it("オプションメニューボタンが正しくレンダリングされる", () => {
      const { getByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      const menuButton = getByTestId("menu-button");
      expect(menuButton).toBeTruthy();
    });

    it("初期状態ではオプションモーダルは非表示", () => {
      const { queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      expect(queryByTestId("options-modal")).toBeFalsy();
    });
  });

  describe("オプションモーダルの表示/非表示", () => {
    it("メニューボタンをタップするとオプションモーダルが表示される", () => {
      const { getByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByTestId("options-modal")).toBeTruthy();
    });

    it("オーナーの場合、すべてのメニュー項目が表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));

      expect(getByText("Edit Name")).toBeTruthy();
      expect(getByText("Make Public")).toBeTruthy();
      expect(getByText("Delete Playlist")).toBeTruthy();
    });

    it("オーナーでない場合、管理メニュー項目は表示されない", () => {
      const { getByTestId, queryByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user2"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));

      expect(queryByText("Edit Name")).toBeFalsy();
      expect(queryByText("Make Public")).toBeFalsy();
      expect(queryByText("Delete Playlist")).toBeFalsy();
    });
  });

  describe("プレイリスト名変更機能", () => {
    it("名前変更ボタンをタップするとリネームモーダルが表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("Edit Name"));

      expect(getByTestId("rename-modal")).toBeTruthy();
    });

    it("新しい名前を入力して保存ボタンをタップするとrenamePlaylistが呼ばれる", async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("Edit Name"));

      const input = getByPlaceholderText("Enter new title");
      fireEvent.changeText(input, "New Playlist Name");

      fireEvent.press(getByText("Update Name"));

      await waitFor(() => {
        expect(renamePlaylist).toHaveBeenCalledWith(
          "playlist1",
          "New Playlist Name",
          "user1",
        );
      });
    });
  });

  describe("削除機能", () => {
    it("削除ボタンをクリックすると警告ダイアログが表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("Delete Playlist"));

      expect(getByTestId("alert-dialog")).toBeTruthy();
    });

    it("削除成功時にライブラリへ戻る", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper },
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("Delete Playlist"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({ pathname: "/library" });
      });
    });
  });
});
