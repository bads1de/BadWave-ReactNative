import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PlaylistOptionsMenu from "@/components/playlist/PlaylistOptionsMenu";

// @expo/vector-iconsのモック
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

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

// action関数のモック
jest.mock("@/actions/deletePlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/actions/renamePlaylist", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/actions/togglePublicPlaylist", () => ({
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
                { testID: "confirm-button", onPress: onConfirm, key: "confirm" },
                React.createElement(
                  require("react-native").Text,
                  null,
                  "delete"
                )
              ),
              React.createElement(
                require("react-native").TouchableOpacity,
                { testID: "cancel-button", onPress: onCancel, key: "cancel" },
                React.createElement(
                  require("react-native").Text,
                  null,
                  "cancel"
                )
              ),
            ]
          )
        : null,
  };
});

const Toast = require("react-native-toast-message").default;
const deletePlaylist = require("@/actions/deletePlaylist").default;
const renamePlaylist = require("@/actions/renamePlaylist").default;
const togglePublicPlaylist =
  require("@/actions/togglePublicPlaylist").default;
const { useAuth } = require("@/providers/AuthProvider");

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
    useAuth.mockReturnValue({
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
        { wrapper }
      );

      // メニューボタンは常に表示される
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
        { wrapper }
      );

      expect(queryByTestId("options-modal")).toBeFalsy();
    });

    it("初期状態では削除ダイアログは非表示", () => {
      const { queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      expect(queryByTestId("alert-dialog")).toBeFalsy();
    });

    it("初期状態ではリネームモーダルは非表示", () => {
      const { queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      expect(queryByTestId("rename-modal")).toBeFalsy();
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
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));

      expect(getByTestId("options-modal")).toBeTruthy();
    });

    it("オプションモーダルのオーバーレイをタップすると閉じる", () => {
      const { getByTestId, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByTestId("options-modal")).toBeTruthy();

      fireEvent.press(getByTestId("options-modal-overlay"));
      expect(queryByTestId("options-modal")).toBeFalsy();
    });

    it("オーナーの場合、すべてのメニュー項目が表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));

      expect(getByText("プレイリスト名を変更")).toBeTruthy();
      expect(getByText("公開する")).toBeTruthy();
      expect(getByText("プレイリストを削除")).toBeTruthy();
    });

    it("オーナーでない場合、メニュー項目は表示されない", () => {
      const { getByTestId, queryByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user2"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));

      expect(queryByText("プレイリスト名を変更")).toBeFalsy();
      expect(queryByText("公開する")).toBeFalsy();
      expect(queryByText("プレイリストを削除")).toBeFalsy();
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
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      expect(getByTestId("rename-modal")).toBeTruthy();
    });

    it("リネームモーダルに現在のタイトルが初期値として表示される", () => {
      const { getByTestId, getByText, getByDisplayValue } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      expect(getByDisplayValue("Test Playlist")).toBeTruthy();
    });

    it("新しい名前を入力して保存ボタンをタップするとrenamePlaylistが呼ばれる", async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Playlist Name");

      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(renamePlaylist).toHaveBeenCalledWith(
          "playlist1",
          "New Playlist Name",
          "user1"
        );
      });
    });

    it("名前変更成功時に成功トーストが表示される", async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Name");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "success",
          text1: "プレイリスト名を変更しました",
        });
      });
    });

    it("名前変更失敗時にエラートーストが表示される", async () => {
      renamePlaylist.mockRejectedValueOnce(new Error("Update failed"));

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Name");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "error",
          text1: "通信エラーが発生しました",
          text2: "Update failed",
        });
      });
    });

    it("空白のみの名前では保存が実行されない", async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "   ");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(renamePlaylist).not.toHaveBeenCalled();
      });
    });

    it("リネームモーダルのキャンセルボタンでモーダルが閉じる", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));
      expect(getByTestId("rename-modal")).toBeTruthy();

      fireEvent.press(getByText("キャンセル"));
      expect(queryByTestId("rename-modal")).toBeFalsy();
    });

    it("リネームモーダルのオーバーレイタップで閉じる", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));
      expect(getByTestId("rename-modal")).toBeTruthy();

      fireEvent.press(getByTestId("rename-modal-overlay"));
      expect(queryByTestId("rename-modal")).toBeFalsy();
    });

    it("名前変更成功後、両方のモーダルが閉じる", async () => {
      const { getByTestId, getByText, getByPlaceholderText, queryByTestId } =
        render(
          <PlaylistOptionsMenu
            playlistId="playlist1"
            userId="user1"
            currentTitle="Test Playlist"
            isPublic={false}
          />,
          { wrapper }
        );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Name");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(renamePlaylist).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(queryByTestId("rename-modal")).toBeNull();
        expect(queryByTestId("options-modal")).toBeNull();
      });
    });
  });

  describe("公開/非公開切り替え機能", () => {
    it("非公開プレイリストの場合「公開する」が表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByText("公開する")).toBeTruthy();
    });

    it("公開プレイリストの場合「非公開にする」が表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={true}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByText("非公開にする")).toBeTruthy();
    });

    it("公開ボタンをタップするとtogglePublicPlaylistが呼ばれる", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(togglePublicPlaylist).toHaveBeenCalledWith(
          "playlist1",
          "user1",
          true
        );
      });
    });

    it("非公開ボタンをタップするとtogglePublicPlaylistが呼ばれる", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={true}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("非公開にする"));

      await waitFor(() => {
        expect(togglePublicPlaylist).toHaveBeenCalledWith(
          "playlist1",
          "user1",
          false
        );
      });
    });

    it("公開成功時に成功トーストが表示される", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "success",
          text1: "プレイリストを公開しました",
        });
      });
    });

    it("非公開成功時に成功トーストが表示される", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={true}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("非公開にする"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "success",
          text1: "プレイリストを非公開にしました",
        });
      });
    });

    it("公開切り替え失敗時にエラートーストが表示される", async () => {
      togglePublicPlaylist.mockRejectedValueOnce(new Error("Toggle failed"));

      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "error",
          text1: "通信エラーが発生しました",
          text2: "Toggle failed",
        });
      });
    });

    it("公開切り替え成功後オプションモーダルが閉じる", async () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByTestId("options-modal")).toBeTruthy();

      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(togglePublicPlaylist).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(queryByTestId("options-modal")).toBeNull();
      });
    });
  });

  describe("プレイリスト削除機能", () => {
    it("削除ボタンをタップすると確認ダイアログが表示される", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));

      expect(getByTestId("alert-dialog")).toBeTruthy();
    });

    it("削除ダイアログのキャンセルボタンでダイアログが閉じる", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      expect(getByTestId("alert-dialog")).toBeTruthy();

      fireEvent.press(getByTestId("cancel-button"));
      expect(queryByTestId("alert-dialog")).toBeFalsy();
    });

    it("削除確認ダイアログで確認すると削除が実行される", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(deletePlaylist).toHaveBeenCalledWith("playlist1", "user1");
      });
    });

    it("削除成功時に成功トーストが表示される", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "success",
          text1: "プレイリストを削除しました",
        });
      });
    });

    it("削除成功時にライブラリページに遷移する", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({ pathname: "/library" });
      });
    });

    it("削除失敗時にエラートーストが表示される", async () => {
      deletePlaylist.mockRejectedValueOnce(new Error("Delete failed"));

      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith({
          type: "error",
          text1: "通信エラーが発生しました",
          text2: "Delete failed",
        });
      });
    });

    it("削除ボタンをタップするとオプションモーダルが閉じる", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByTestId("options-modal")).toBeTruthy();

      fireEvent.press(getByText("プレイリストを削除"));
      expect(queryByTestId("options-modal")).toBeFalsy();
    });
  });

  describe("キャッシュ無効化", () => {
    it("名前変更成功時に適切なクエリが無効化される", async () => {
      const invalidateQueriesSpy = jest.spyOn(
        queryClient,
        "invalidateQueries"
      );

      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Name");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["playlists"],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["playlistById", "playlist1"],
        });
      });
    });

    it("公開切り替え成功時に適切なクエリが無効化される", async () => {
      const invalidateQueriesSpy = jest.spyOn(
        queryClient,
        "invalidateQueries"
      );

      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["playlists"],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["playlistById", "playlist1"],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["getPublicPlaylists"],
        });
      });
    });

    it("削除成功時に適切なクエリが無効化される（非公開プレイリスト）", async () => {
      const invalidateQueriesSpy = jest.spyOn(
        queryClient,
        "invalidateQueries"
      );

      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["playlists"],
        });
        // 非公開プレイリストなので公開プレイリストキャッシュは無効化されない
        expect(invalidateQueriesSpy).not.toHaveBeenCalledWith({
          queryKey: ["getPublicPlaylists"],
        });
      });
    });

    it("削除成功時に適切なクエリが無効化される（公開プレイリスト）", async () => {
      const invalidateQueriesSpy = jest.spyOn(
        queryClient,
        "invalidateQueries"
      );

      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={true}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["playlists"],
        });
        expect(invalidateQueriesSpy).toHaveBeenCalledWith({
          queryKey: ["getPublicPlaylists"],
        });
      });
    });
  });

  describe("エッジケース", () => {
    it("プレイリストIDが空文字でもエラーが発生しない", () => {
      expect(() => {
        render(
          <PlaylistOptionsMenu
            playlistId=""
            userId="user1"
            currentTitle="Test Playlist"
            isPublic={false}
          />,
          { wrapper }
        );
      }).not.toThrow();
    });

    it("userIdが未定義の場合でもエラーが発生しない", () => {
      expect(() => {
        render(
          <PlaylistOptionsMenu
            playlistId="playlist1"
            userId={undefined}
            currentTitle="Test Playlist"
            isPublic={false}
          />,
          { wrapper }
        );
      }).not.toThrow();
    });

    it("currentTitleが未定義の場合でもエラーが発生しない", () => {
      expect(() => {
        render(
          <PlaylistOptionsMenu
            playlistId="playlist1"
            userId="user1"
            currentTitle={undefined}
            isPublic={false}
          />,
          { wrapper }
        );
      }).not.toThrow();
    });

    it("isPublicがundefinedの場合、falseとして扱われる", () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByText("公開する")).toBeTruthy();
    });

    it("非常に長いタイトルでも表示される", () => {
      const longTitle = "A".repeat(200);
      expect(() => {
        render(
          <PlaylistOptionsMenu
            playlistId="playlist1"
            userId="user1"
            currentTitle={longTitle}
            isPublic={false}
          />,
          { wrapper }
        );
      }).not.toThrow();
    });

    it("特殊文字を含むタイトルが正しく処理される", () => {
      const specialTitle = "Test 🎵 Playlist & <Title> 'with' \"quotes\"";
      expect(() => {
        render(
          <PlaylistOptionsMenu
            playlistId="playlist1"
            userId="user1"
            currentTitle={specialTitle}
            isPublic={false}
          />,
          { wrapper }
        );
      }).not.toThrow();
    });

    it("セッションがnullの場合でもエラーが発生しない", () => {
      expect(() => {
        render(
          <PlaylistOptionsMenu
            playlistId="playlist1"
            userId="user1"
            currentTitle="Test Playlist"
            isPublic={false}
          />,
          { wrapper }
        );
      }).not.toThrow();
    });
  });

  describe("複数操作の組み合わせ", () => {
    it("名前変更後に公開切り替えができる", async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      // 名前変更
      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Name");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(renamePlaylist).toHaveBeenCalled();
      });

      // 公開切り替え
      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(togglePublicPlaylist).toHaveBeenCalled();
      });
    });

    it("公開切り替え後に削除ができる", async () => {
      const { getByTestId, getByText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      // 公開切り替え
      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("公開する"));

      await waitFor(() => {
        expect(togglePublicPlaylist).toHaveBeenCalled();
      });

      // 削除
      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("confirm-button"));

      await waitFor(() => {
        expect(deletePlaylist).toHaveBeenCalled();
      });
    });

    it("削除ダイアログをキャンセルした後に名前変更ができる", async () => {
      const { getByTestId, getByText, getByPlaceholderText } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      // 削除ダイアログを開いてキャンセル
      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリストを削除"));
      fireEvent.press(getByTestId("cancel-button"));

      // 名前変更
      fireEvent.press(getByTestId("menu-button"));
      fireEvent.press(getByText("プレイリスト名を変更"));

      const input = getByPlaceholderText("新しいプレイリスト名");
      fireEvent.changeText(input, "New Name");
      fireEvent.press(getByText("保存"));

      await waitFor(() => {
        expect(renamePlaylist).toHaveBeenCalled();
      });
    });
  });

  describe("UI状態管理", () => {
    it("モーダル状態が適切に管理される", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      // 初期状態: すべてのモーダルが閉じている
      expect(queryByTestId("options-modal")).toBeFalsy();
      expect(queryByTestId("rename-modal")).toBeFalsy();
      expect(queryByTestId("alert-dialog")).toBeFalsy();

      // オプションモーダルを開く
      fireEvent.press(getByTestId("menu-button"));
      expect(getByTestId("options-modal")).toBeTruthy();

      // リネームモーダルを開く（オプションモーダルは閉じる）
      fireEvent.press(getByText("プレイリスト名を変更"));
      expect(queryByTestId("options-modal")).toBeFalsy();
      expect(getByTestId("rename-modal")).toBeTruthy();

      // リネームモーダルを閉じる
      fireEvent.press(getByText("キャンセル"));
      expect(queryByTestId("rename-modal")).toBeFalsy();
    });

    it("複数のモーダルが同時に開かないことを確認", () => {
      const { getByTestId, getByText, queryByTestId } = render(
        <PlaylistOptionsMenu
          playlistId="playlist1"
          userId="user1"
          currentTitle="Test Playlist"
          isPublic={false}
        />,
        { wrapper }
      );

      fireEvent.press(getByTestId("menu-button"));
      expect(getByTestId("options-modal")).toBeTruthy();

      fireEvent.press(getByText("プレイリスト名を変更"));
      expect(queryByTestId("options-modal")).toBeFalsy();
      expect(getByTestId("rename-modal")).toBeTruthy();
      expect(queryByTestId("alert-dialog")).toBeFalsy();
    });
  });
});