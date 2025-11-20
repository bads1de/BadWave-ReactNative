import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ReelsList from "@/components/reels/ReelsList";
import { Spotlight } from "@/types";

// Mock ReelItem to check props
jest.mock("@/components/reels/ReelItem", () => {
  const { View, Text } = require("react-native");
  return function MockReelItem({
    item,
    isVisible,
  }: {
    item: any;
    isVisible: boolean;
  }) {
    return (
      <View testID={`reel-item-${item.id}`}>
        <Text>{item.title}</Text>
        <Text testID={`is-visible-${item.id}`}>{isVisible.toString()}</Text>
      </View>
    );
  };
});

describe("ReelsList", () => {
  const mockSpotlights: Spotlight[] = [
    {
      id: "1",
      video_path: "video1.mp4",
      artist: "Artist 1",
      title: "Song 1",
      description: "Desc 1",
      public: true,
      created_at: "2023-01-01",
      user_id: "user1",
    },
    {
      id: "2",
      video_path: "video2.mp4",
      artist: "Artist 2",
      title: "Song 2",
      description: "Desc 2",
      public: true,
      created_at: "2023-01-02",
      user_id: "user2",
    },
  ];

  it("renders list of items", () => {
    const { getByText } = render(<ReelsList data={mockSpotlights} />);
    expect(getByText("Song 1")).toBeTruthy();
    expect(getByText("Song 2")).toBeTruthy();
  });

  // Note: Testing onViewableItemsChanged in unit tests is tricky because FlatList
  // doesn't fire it automatically in this environment without complex setup.
  // We will verify the initial state (first item visible) if possible,
  // or rely on integration tests for scroll behavior.

  it("initially sets the first item as visible", () => {
    const { getByTestId } = render(<ReelsList data={mockSpotlights} />);
    // This expectation depends on how we initialize the state.
    // If we initialize with index 0, it should be true.
    expect(getByTestId("is-visible-1").children[0]).toBe("true");
    expect(getByTestId("is-visible-2").children[0]).toBe("false");
  });
});
