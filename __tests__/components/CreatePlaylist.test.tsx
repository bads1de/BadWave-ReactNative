import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CreatePlaylist from "../../components/playlist/CreatePlaylist";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";

// モックの設定
jest.mock("@tanstack/react-query", () => ({
  useMutation: jest.fn(),
  useQueryClient: jest.fn(),
}));

jest.mock("react-native-toast-message", () => {
  const mockShow = jest.fn();
  return {
    __esModule: true,
    default: {
      show: mockShow,
      hide: jest.fn(),
      setRef: jest.fn(),
      getRef: jest.fn(),
    },
    show: mockShow,
  };
});

jest.mock("../../actions/createPlaylist", () => jest.fn());

describe("CreatePlaylist", () => {
  // モックの設定
  const mockMutate = jest.fn();
  const mockInvalidateQueries = jest.fn();
  const mockQueryClient = {
    invalidateQueries: mockInvalidateQueries,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // useQueryClient のモック
    (useQueryClient as jest.Mock).mockReturnValue(mockQueryClient);

    // useMutation のモック
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      error: null,
      isPending: false,
    });
  });

  it("「+ New Playlist」ボタンをクリックするとモーダルが表示される", () => {
    const { getByText, queryByText, getByTestId } = render(<CreatePlaylist />);

    // 初期状態ではモーダルは表示されていない
    expect(queryByText("Enter playlist name:")).toBeNull();

    // ボタンをクリック
    fireEvent.press(getByTestId("create-playlist-button"));

    // モーダルが表示される
    expect(getByText("Enter playlist name:")).toBeTruthy();
  });

  it("キャンセルボタンをクリックするとモーダルが閉じる", () => {
    const { getByText, queryByText, getByTestId } = render(<CreatePlaylist />);

    // モーダルを表示
    fireEvent.press(getByTestId("create-playlist-button"));
    expect(getByText("Enter playlist name:")).toBeTruthy();

    // キャンセルボタンをクリック
    fireEvent.press(getByTestId("cancel-button"));

    // モーダルが閉じる
    expect(queryByText("Enter playlist name:")).toBeNull();
  });

  it("プレイリスト名が空の場合はエラーメッセージを表示する", () => {
    const { getByTestId } = render(<CreatePlaylist />);

    // モーダルを表示
    fireEvent.press(getByTestId("create-playlist-button"));

    // 空のプレイリスト名で作成ボタンをクリック
    fireEvent.press(getByTestId("create-button"));

    // エラーメッセージが表示される
    expect(Toast.show).toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
      })
    );

    // mutate は呼ばれない
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("プレイリスト名を入力して作成ボタンをクリックすると、プレイリストが作成される", () => {
    const { getByTestId } = render(<CreatePlaylist />);

    // モーダルを表示
    fireEvent.press(getByTestId("create-playlist-button"));

    // プレイリスト名を入力
    const input = getByTestId("playlist-name-input");
    fireEvent.changeText(input, "テストプレイリスト");

    // 作成ボタンをクリック
    fireEvent.press(getByTestId("create-button"));

    // mutate が呼ばれる
    expect(mockMutate).toHaveBeenCalledWith("テストプレイリスト");
  });

  it("作成中は「Creating...」と表示される", () => {
    // isPending を true に設定
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      error: null,
      isPending: true,
    });

    const { getByText, getByTestId } = render(<CreatePlaylist />);

    // モーダルを表示
    fireEvent.press(getByTestId("create-playlist-button"));

    // 「Creating...」が表示される
    expect(getByText("Creating...")).toBeTruthy();
  });

  it("エラーが発生した場合はエラーメッセージが表示される", () => {
    // エラーを設定
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      error: new Error("テストエラー"),
      isPending: false,
    });

    const { getByText, getByTestId } = render(<CreatePlaylist />);

    // モーダルを表示
    fireEvent.press(getByTestId("create-playlist-button"));

    // エラーメッセージが表示される
    expect(getByText("テストエラー")).toBeTruthy();
  });

  it("作成成功時にモーダルが閉じてトーストが表示される", () => {
    // useMutation の onSuccess コールバックを呼び出す
    (useMutation as jest.Mock).mockImplementation(({ onSuccess }) => {
      return {
        mutate: (name: string) => {
          onSuccess();
        },
        error: null,
        isPending: false,
      };
    });

    const { queryByText, getByTestId } = render(<CreatePlaylist />);

    // モーダルを表示
    fireEvent.press(getByTestId("create-playlist-button"));

    // プレイリスト名を入力
    const input = getByTestId("playlist-name-input");
    fireEvent.changeText(input, "テストプレイリスト");

    // 作成ボタンをクリック
    fireEvent.press(getByTestId("create-button"));

    // モーダルが閉じる
    expect(queryByText("Enter playlist name:")).toBeNull();

    // トーストが表示される
    expect(Toast.show).toHaveBeenCalled();
    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "success",
      })
    );

    // キャッシュが無効化される
    expect(mockInvalidateQueries).toHaveBeenCalled();
  });
});

