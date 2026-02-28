import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PlaylistItem from "@/components/item/PlaylistItem";
import { Playlist } from "@/types";

// モック
jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));

describe("PlaylistItem Component", () => {
  const mockPlaylist: Playlist = {
    id: "p1",
    user_id: "u1",
    title: "My Awesome Playlist",
    image_path: "p-image",
    is_public: true,
    created_at: "2024-01-01",
  };

  it("プレイリスト情報が表示される", () => {
    const { getByText } = render(
      <PlaylistItem playlist={mockPlaylist} onPress={jest.fn()} />,
    );

    expect(getByText("My Awesome Playlist")).toBeTruthy();
    expect(getByText("COLLECTION")).toBeTruthy();
  });

  it("押下時に onPress が呼ばれる", () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <PlaylistItem
        playlist={mockPlaylist}
        onPress={onPressMock}
        testID="p-item"
      />,
    );

    fireEvent.press(getByTestId("p-item"));
    expect(onPressMock).toHaveBeenCalledWith(mockPlaylist);
  });
});
