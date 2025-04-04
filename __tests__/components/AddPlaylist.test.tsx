import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "../../providers/AuthProvider";
import Toast from "react-native-toast-message";
import usePlaylistStatus from "../../hooks/usePlaylistStatus";

// AsyncStorageのモック
jest.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve(null)),
    multiGet: jest.fn(() => Promise.resolve(null)),
    multiSet: jest.fn(() => Promise.resolve(null)),
    multiRemove: jest.fn(() => Promise.resolve(null)),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    clear: jest.fn(() => Promise.resolve(null)),
  },
}));

// Supabaseのモック
jest.mock("../../lib/supabase", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            data: [],
            error: null,
          })),
        })),
      })),
    })),
    auth: {
      getSession: jest.fn(() =>
        Promise.resolve({ data: { session: null }, error: null })
      ),
    },
  },
}));

// モックの設定
jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
  useQuery: jest.fn(),
}));

jest.mock("../../providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

jest.mock("../../hooks/usePlaylistStatus", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// AddPlaylist コンポーネントをインポート
// 注意: モックの設定後にインポートする必要があります
const AddPlaylist = require("../../components/AddPlaylist").default;

describe("AddPlaylist", () => {
  // モックの設定
  const mockMutate = jest.fn();
  const mockInvalidateQueries = jest.fn();
  const mockQueryClient = {
    invalidateQueries: mockInvalidateQueries,
  };
  const mockFetchAddedStatus = jest.fn();
  const mockPlaylists = [
    {
      id: "p1",
      title: "プレイリスト1",
      user_id: "user1",
      image_path: "https://example.com/image1.jpg",
      is_public: true,
      created_at: "2023-01-01",
    },
    {
      id: "p2",
      title: "プレイリスト2",
      user_id: "user1",
      image_path: "https://example.com/image2.jpg",
      is_public: false,
      created_at: "2023-01-02",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // useAuth のモック
    (useAuth as jest.Mock).mockReturnValue({
      session: { user: { id: "user1" } },
    });

    // useQueryClient のモック
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    // useMutation のモック
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      error: null,
      isPending: false,
    });

    // useQuery のモック
    (useQuery as jest.Mock).mockReturnValue({
      data: mockPlaylists,
      isLoading: false,
      error: null,
    });

    // usePlaylistStatus のモック
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      isAdded: { p1: true, p2: false },
      fetchAddedStatus: mockFetchAddedStatus,
    });
  });

  it("ボタンをクリックするとモーダルが表示される", () => {
    const { getByTestId, queryByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // 初期状態ではモーダルは表示されていない
    expect(queryByTestId("modal-title")).toBeNull();

    // ボタンをクリック
    fireEvent.press(getByTestId("add-playlist-button"));

    // モーダルが表示される
    expect(queryByTestId("modal-title")).toBeTruthy();
  });

  it("未ログイン状態でボタンをクリックするとトーストが表示される", () => {
    // 未ログイン状態にする
    (useAuth as jest.Mock).mockReturnValue({
      session: null,
    });

    const { getByTestId } = render(<AddPlaylist songId="song1" />);

    // ボタンをクリック
    fireEvent.press(getByTestId("add-playlist-button"));

    // トーストが表示される
    expect(Toast.show).toHaveBeenCalledWith({
      type: "error",
      text1: "ログインが必要です",
      position: "bottom",
    });
  });

  it("プレイリストをクリックすると追加処理が実行される", () => {
    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // プレイリストをクリック（まだ追加されていないもの）
    const playlistItems = getAllByTestId("playlist-item");
    fireEvent.press(playlistItems[1]); // p2 (isAdded: false)

    // mutate が呼ばれる
    expect(mockMutate).toHaveBeenCalledWith({
      playlistId: "p2",
      songId: "song1",
    });
  });

  it("すでに追加済みのプレイリストをクリックすると削除処理が実行される", () => {
    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // プレイリストをクリック（すでに追加されているもの）
    const playlistItems = getAllByTestId("playlist-item");
    fireEvent.press(playlistItems[0]); // p1 (isAdded: true)

    // mutate が呼ばれる
    expect(mockMutate).toHaveBeenCalledWith({
      playlistId: "p1",
      songId: "song1",
    });
  });

  it("追加/削除成功時にステータスが更新される", () => {
    // useMutation の onSuccess コールバックを呼び出す
    (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
      return {
        mutate: (params: any) => {
          onSuccess();
        },
        error: null,
        isPending: false,
      };
    });

    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // プレイリストをクリック
    const playlistItems = getAllByTestId("playlist-item");
    fireEvent.press(playlistItems[0]);

    // ステータスが更新される
    expect(mockFetchAddedStatus).toHaveBeenCalled();
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });
});
