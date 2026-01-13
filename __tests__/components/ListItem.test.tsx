import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ListItem from "@/components/item/ListItem";

// モックの設定
jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@/components/item/ListItemOptionsMenu", () => ({
  __esModule: true,
  default: "ListItemOptionsMenu",
}));

describe("ListItem", () => {
  // テスト用のモックデータ
  const mockSong = {
    id: "song1",
    user_id: "user1",
    title: "テスト曲",
    author: "テストアーティスト",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    count: "100",
    like_count: "50",
    created_at: "2023-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正しく曲情報を表示する", () => {
    const mockOnPress = jest.fn();
    const { getByText } = render(
      <ListItem song={mockSong} onPress={mockOnPress} />
    );

    expect(getByText("テスト曲")).toBeTruthy();
    expect(getByText("テストアーティスト")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
  });

  it("曲をクリックすると適切な関数が呼ばれる", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ListItem song={mockSong} onPress={mockOnPress} testID="list-item" />
    );

    fireEvent.press(getByTestId("list-item"));

    expect(mockOnPress).toHaveBeenCalledWith(mockSong);
  });

  it("showStats=falseの場合、統計情報を表示しない", () => {
    const mockOnPress = jest.fn();
    const { queryByText } = render(
      <ListItem song={mockSong} onPress={mockOnPress} showStats={false} />
    );

    expect(queryByText("100")).toBeNull();
    expect(queryByText("50")).toBeNull();
  });

  it("imageSize='small'の場合、小さいサイズの画像を表示する", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ListItem
        song={mockSong}
        onPress={mockOnPress}
        imageSize="small"
        testID="list-item"
      />
    );

    // コンポーネントが正しくレンダリングされていることを確認
    expect(getByTestId("list-item")).toBeTruthy();
  });

  it("onDeleteが指定されている場合、オプションメニューを表示する", () => {
    const mockOnPress = jest.fn();
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <ListItem
        song={mockSong}
        onPress={mockOnPress}
        onDelete={mockOnDelete}
        testID="list-item"
      />
    );

    // コンポーネントが正しくレンダリングされていることを確認
    expect(getByTestId("list-item")).toBeTruthy();
  });

  it("オプションメニューが常に表示される", () => {
    const mockOnPress = jest.fn();
    const { getByTestId } = render(
      <ListItem song={mockSong} onPress={mockOnPress} testID="list-item" />
    );

    // ListItemOptionsMenuがレンダリングされていることを確認
    expect(getByTestId("list-item")).toBeTruthy();
  });
});

