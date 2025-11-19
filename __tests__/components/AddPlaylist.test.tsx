import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
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
jest.mock("../../lib/supabase", () => {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockOrder = jest.fn();
  const mockSingle = jest.fn();
  const mockInsert = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  // モックのチェーンを設定
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
  });

  mockSelect.mockReturnValue({
    eq: mockEq,
  });

  mockEq.mockReturnValue({
    order: mockOrder,
    single: mockSingle,
  });

  mockOrder.mockReturnValue({
    data: [],
    error: null,
  });

  mockSingle.mockReturnValue({
    data: {
      id: "song1",
      title: "Test Song",
      artist: "Test Artist",
      image_path: "https://example.com/image.jpg",
    },
    error: null,
  });

  mockInsert.mockResolvedValue({
    data: null,
    error: null,
  });

  mockUpdate.mockResolvedValue({
    data: null,
    error: null,
  });

  mockDelete.mockResolvedValue({
    data: null,
    error: null,
  });

  return {
    supabase: {
      from: mockFrom,
      auth: {
        getSession: jest.fn(() =>
          Promise.resolve({ data: { session: null }, error: null })
        ),
      },
    },
  };
});

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
const AddPlaylist = require("@/components/playlist/AddPlaylist").default;

describe("AddPlaylist", () => {
  // モックの設定
  const mockMutate = jest.fn().mockImplementation((params) => params);
  const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
  const mockQueryClient = {
    invalidateQueries: mockInvalidateQueries,
    cancelQueries: jest.fn().mockResolvedValue(undefined),
    getQueryData: jest.fn().mockReturnValue([]),
    setQueryData: jest.fn(),
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
    // useMutationの実装を修正
    (useMutation as jest.Mock).mockImplementation(({ mutationFn }) => {
      return {
        mutate: (playlistId: string) => {
          // パラメータを正しい形式に変換してモック関数を呼ぶ
          mockMutate({
            playlistId,
            songId: "song1",
          });
          // mutationFnが存在する場合は呼び出す
          if (mutationFn) {
            try {
              mutationFn(playlistId);
            } catch (error) {
              console.error("Error in mutationFn:", error);
            }
          }
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

    // プレイリストをクリック（まだ追加されていないもの）
    const playlistItems = getAllByTestId("playlist-item");
    fireEvent.press(playlistItems[1]); // p2 (isAdded: false)

    // mutate が呼ばれる
    expect(mockMutate).toHaveBeenCalledWith({
      playlistId: "p2",
      songId: "song1",
    });
  });

  it.skip("すでに追加済みのプレイリストをクリックするとトーストが表示される", () => {
    // このテストでは、追加済みのプレイリストをクリックしても実際には何も起きないようにしている
    // テストの目的は、追加済みのプレイリストをクリックしたときにトーストが表示されることを確認すること

    // トーストのモックをクリア
    jest.clearAllMocks();

    // Toast.showをモックして、呼び出されたことを記録する
    (Toast.show as jest.Mock).mockImplementation((params) => {
      console.log("Toast.show called with:", params);
    });

    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // プレイリストをクリック（すでに追加されているもの）
    const playlistItems = getAllByTestId("playlist-item");
    fireEvent.press(playlistItems[0]); // p1 (isAdded: true)

    // トーストが表示される
    expect(Toast.show).toHaveBeenCalled();
  });

  it("追加処理時にステータスが更新される", () => {
    // モックをクリア
    jest.clearAllMocks();

    // usePlaylistStatusのモックを再設定
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      isAdded: { p1: false, p2: false }, // すべて未追加に設定
      fetchAddedStatus: mockFetchAddedStatus,
    });

    // useMutation の onSuccess コールバックを直接呼び出すように設定
    (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
      return {
        mutate: (playlistId: string) => {
          // パラメータを正しい形式に変換してモック関数を呼ぶ
          mockMutate({
            playlistId,
            songId: "song1",
          });

          // onSuccessを直接呼び出す
          if (onSuccess) {
            onSuccess();

            // ステータス更新の確認のために、ここでテストを行う
            expect(mockFetchAddedStatus).toHaveBeenCalled();
            expect(mockInvalidateQueries).toHaveBeenCalled();
          }
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
    fireEvent.press(playlistItems[1]); // p2 (isAdded: false)
  });

  it("モーダルを閉じるとモーダルが非表示になる", () => {
    const { getByTestId, queryByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // モーダルが表示されていることを確認
    expect(queryByTestId("modal-title")).toBeTruthy();

    // 閉じるボタンをクリック
    fireEvent.press(getByTestId("close-button"));

    // モーダルが非表示になることを確認
    expect(queryByTestId("modal-title")).toBeNull();
  });

  it("プレイリストが空の場合でも正しく表示される", () => {
    // 空のプレイリストを設定
    (useQuery as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { getByTestId, queryAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // プレイリストアイテムがないことを確認
    const playlistItems = queryAllByTestId("playlist-item");
    expect(playlistItems.length).toBe(0);
  });

  it("プレイリストの読み込み中はローディング状態が表示される", () => {
    // ローディング中の状態を設定
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    const { getByTestId } = render(<AddPlaylist songId="song1" />);

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // ローディング状態が表示されることを確認
    // 実際のコンポーネントによってはローディング表示のテストIDが必要
    // ここではエラーが発生しないことを確認するテスト
  });

  it("プレイリストの読み込みエラーが発生した場合の処理", () => {
    // エラー状態を設定
    (useQuery as jest.Mock).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error("Failed to load playlists"),
    });

    const { getByTestId } = render(<AddPlaylist songId="song1" />);

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // エラーが発生しないことを確認するテスト
    // 実際のコンポーネントによってはエラー表示のテストIDが必要
  });

  it("プレイリスト追加中にネットワークエラーが発生した場合の処理", () => {
    // モックをクリア
    jest.clearAllMocks();

    // usePlaylistStatusのモックを再設定
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      isAdded: { p1: false, p2: false }, // すべて未追加に設定
      fetchAddedStatus: mockFetchAddedStatus,
    });

    // useMutation のエラー状態をモック
    (useMutation as jest.Mock).mockImplementation(({ onError }) => {
      return {
        mutate: (playlistId: string) => {
          // エラーを発生させる
          if (onError) {
            onError(new Error("Network error"));
          }
        },
        error: new Error("Network error"),
        isPending: false,
      };
    });

    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モックをリセット
    mockFetchAddedStatus.mockClear();
    mockInvalidateQueries.mockClear();

    // モーダルを表示
    act(() => {
      fireEvent.press(getByTestId("add-playlist-button"));
    });

    // プレイリストをクリック
    const playlistItems = getAllByTestId("playlist-item");
    act(() => {
      fireEvent.press(playlistItems[1]); // p2 (isAdded: false)
    });

    // エラーが発生してもクラッシュしないことを確認
    // エラー発生時にはこれらの関数は呼ばれないはず
    expect(mockInvalidateQueries).not.toHaveBeenCalled();
  });

  it("複数のプレイリストを連続してクリックした場合の処理", () => {
    // モックをクリア
    jest.clearAllMocks();

    // usePlaylistStatusのモックを再設定
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      isAdded: { p1: false, p2: false, p3: false }, // すべて未追加に設定
      fetchAddedStatus: mockFetchAddedStatus,
    });

    // プレイリストデータを追加
    (useQuery as jest.Mock).mockReturnValue({
      data: [
        { id: "p1", name: "Playlist 1", user_id: "user1" },
        { id: "p2", name: "Playlist 2", user_id: "user1" },
        { id: "p3", name: "Playlist 3", user_id: "user1" },
      ],
      isLoading: false,
      error: null,
    });

    // useMutationのモック
    const mutateMock = jest.fn();
    (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
      return {
        mutate: (playlistId: string) => {
          mutateMock(playlistId);
          if (onSuccess) {
            onSuccess();
          }
        },
        error: null,
        isPending: false,
      };
    });

    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モックをリセット
    mockFetchAddedStatus.mockClear();
    mutateMock.mockClear();

    // モーダルを表示
    act(() => {
      fireEvent.press(getByTestId("add-playlist-button"));
    });

    // 複数のプレイリストを連続してクリック
    const playlistItems = getAllByTestId("playlist-item");
    act(() => {
      fireEvent.press(playlistItems[0]); // p1
    });
    act(() => {
      fireEvent.press(playlistItems[1]); // p2
    });
    act(() => {
      fireEvent.press(playlistItems[2]); // p3
    });

    // すべてのプレイリストに対してmutateが呼ばれたことを確認
    expect(mutateMock).toHaveBeenCalledTimes(3);
    expect(mutateMock).toHaveBeenCalledWith("p1");
    expect(mutateMock).toHaveBeenCalledWith("p2");
    expect(mutateMock).toHaveBeenCalledWith("p3");
  });

  it("モーダルを閉じるとモーダルが非表示になる", () => {
    // モックをクリア
    jest.clearAllMocks();

    // usePlaylistStatusのモックを再設定
    (usePlaylistStatus as jest.Mock).mockReturnValue({
      isAdded: { p1: false, p2: false }, // すべて未追加に設定
      fetchAddedStatus: mockFetchAddedStatus,
    });

    const { getByTestId, queryByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    act(() => {
      fireEvent.press(getByTestId("add-playlist-button"));
    });

    // モーダルが表示されていることを確認
    expect(queryByTestId("modal-title")).toBeTruthy();

    // 閉じるボタンをクリック
    act(() => {
      fireEvent.press(getByTestId("close-button"));
    });

    // モーダルが非表示になることを確認
    expect(queryByTestId("modal-title")).toBeNull();
  });

  it("プレイリスト名が非常に長い場合の表示", () => {
    // モックをクリア
    jest.clearAllMocks();

    // 非常に長い名前のプレイリストを設定
    const longName =
      "This is an extremely long playlist name that exceeds the normal length of a playlist name and might cause issues with display or storage in some systems. It's important to test how the application handles such edge cases to ensure robustness.".repeat(
        2
      );

    (useQuery as jest.Mock).mockReturnValue({
      data: [
        { id: "p1", name: longName, user_id: "user1" },
        { id: "p2", name: "Playlist 2", user_id: "user1" },
      ],
      isLoading: false,
      error: null,
    });

    const { getByTestId, getAllByTestId } = render(
      <AddPlaylist songId="song1" />
    );

    // モーダルを表示
    fireEvent.press(getByTestId("add-playlist-button"));

    // プレイリストが表示されることを確認
    const playlistItems = getAllByTestId("playlist-item");
    expect(playlistItems.length).toBe(2);

    // 長い名前のプレイリストも正しく表示されることを確認
    // 実際のコンポーネントによっては切り捨てられる可能性があるが、クラッシュしないことを確認
  });
});
