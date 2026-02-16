import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ListItem from "@/components/item/ListItem";
import Song from "@/types";

// モック
jest.mock("@/components/item/ListItemOptionsMenu", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));
jest.mock("expo-image", () => ({
  Image: "Image",
}));
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

describe("ListItem Component", () => {
  const mockSong: Song = {
    id: "s1",
    user_id: "u1",
    title: "Test Song",
    author: "Test Author",
    song_path: "path",
    image_path: "image-path",
    count: "100",
    like_count: "50",
    created_at: "2024-01-01",
  };

  it("楽曲情報が正しく表示される", () => {
    const { getByText } = render(
      <ListItem song={mockSong} onPress={jest.fn()} />,
    );

    expect(getByText("Test Song")).toBeTruthy();
    expect(getByText("Test Author")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
  });

  it("押下時に onPress が呼ばれる", () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <ListItem song={mockSong} onPress={onPressMock} testID="list-item" />,
    );

    fireEvent.press(getByTestId("list-item"));
    expect(onPressMock).toHaveBeenCalledWith(mockSong);
  });

  it("showStats=false の場合、数値が表示されない", () => {
    const { queryByText } = render(
      <ListItem song={mockSong} onPress={jest.fn()} showStats={false} />,
    );

    expect(queryByText("100")).toBeNull();
    expect(queryByText("50")).toBeNull();
  });
});
