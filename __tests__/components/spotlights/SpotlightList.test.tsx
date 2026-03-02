import React from "react";
import { render } from "@testing-library/react-native";
import SpotlightList from "@/components/spotlights/SpotlightList";
import { Spotlight } from "@/types";

// Mock FlashList to use FlatList for tests
jest.mock("@shopify/flash-list", () => {
  const { FlatList } = require("react-native");
  return {
    FlashList: FlatList,
  };
});

// Mock SpotlightItem to check props
jest.mock("@/components/spotlights/SpotlightItem", () => {
  const { View, Text } = require("react-native");
  const { useSpotlightStore } = require("@/hooks/stores/useSpotlightStore");
  return function MockSpotlightItem({
    item,
    index,
  }: {
    item: any;
    index: number;
  }) {
    const visibleIndex = useSpotlightStore((state: any) => state.visibleIndex);
    const isVisible = visibleIndex === index;
    return (
      <View testID={`spotlight-item-${item.id}`}>
        <Text>{item.title}</Text>
        <Text testID={`is-visible-${item.id}`}>{isVisible.toString()}</Text>
      </View>
    );
  };
});

// Mock useBottomTabBarHeight
jest.mock("@react-navigation/bottom-tabs", () => ({
  useBottomTabBarHeight: () => 49,
}));

describe("SpotlightList", () => {
  const mockSpotlights: Spotlight[] = [
    {
      id: "1",
      video_path: "video1.mp4",
      author: "Artist 1",
      title: "Song 1",
      description: "Desc 1",
    },
    {
      id: "2",
      video_path: "video2.mp4",
      author: "Artist 2",
      title: "Song 2",
      description: "Desc 2",
    },
  ];

  it("renders list of items", () => {
    const { getByText } = render(<SpotlightList data={mockSpotlights} />);
    expect(getByText("Song 1")).toBeTruthy();
    expect(getByText("Song 2")).toBeTruthy();
  });

  it("initially sets the first item as visible", () => {
    const { getByTestId } = render(<SpotlightList data={mockSpotlights} />);
    expect(getByTestId("is-visible-1").children[0]).toBe("true");
    expect(getByTestId("is-visible-2").children[0]).toBe("false");
  });
});
