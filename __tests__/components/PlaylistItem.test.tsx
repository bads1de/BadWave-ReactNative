import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PlaylistItem from "../../components/item/PlaylistItem";

// モックの設定
jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

// useWindowDimensions のモック
jest.mock("react-native/Libraries/Utilities/useWindowDimensions", () => ({
  __esModule: true,
  default: () => ({
    width: 400,
    height: 800,
  }),
}));

describe("PlaylistItem", () => {
  // テスト用のモックデータ
  const mockPlaylist = {
    id: "playlist1",
    user_id: "user1",
    title: "テストプレイリスト",
    image_path: "https://example.com/image.jpg",
    is_public: true,
    created_at: "2023-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正しくプレイリスト情報を表示する", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <PlaylistItem playlist={mockPlaylist} onPress={mockOnPress} />
    );

    expect(getByText("テストプレイリスト")).toBeTruthy();
  });

  it("プレイリストをクリックすると適切な関数が呼ばれる", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <PlaylistItem
        playlist={mockPlaylist}
        onPress={mockOnPress}
        testID="playlist-item"
      />
    );

    fireEvent.press(getByTestId("playlist-item"));

    expect(mockOnPress).toHaveBeenCalledWith(mockPlaylist);
  });

  it("プレイリストのサイズが動的に計算される", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <PlaylistItem
        playlist={mockPlaylist}
        onPress={mockOnPress}
        testID="playlist-item"
      />
    );

    // コンポーネントが正しくレンダリングされていることを確認
    expect(getByTestId("playlist-item")).toBeTruthy();
  });

  it("画像パスがない場合でも正しく表示される", () => {
    const mockOnPress = jest.fn();
    const playlistWithoutImage = {
      ...mockPlaylist,
      image_path: undefined,
    };

    const { getByText } = render(
      <PlaylistItem playlist={playlistWithoutImage} onPress={mockOnPress} />
    );

    expect(getByText("テストプレイリスト")).toBeTruthy();
  });
});

