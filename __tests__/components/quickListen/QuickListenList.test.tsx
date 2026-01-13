import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import QuickListenList from "@/components/quickListen/QuickListenList";
import Song from "@/types";

// FlashList をモック（テスト環境では正しくレンダリングされないため）
jest.mock("@shopify/flash-list", () => {
  const { View } = require("react-native");
  return {
    FlashList: ({ data, renderItem, keyExtractor }: any) => (
      <View testID="flash-list">
        {data.map((item: any, index: number) => renderItem({ item, index }))}
      </View>
    ),
  };
});

// QuickListenItem をモック
jest.mock("@/components/quickListen/QuickListenItem", () => {
  const { View, Text } = require("react-native");
  return function MockQuickListenItem({
    song,
    isVisible,
  }: {
    song: Song;
    isVisible: boolean;
  }) {
    return (
      <View testID={`quick-listen-item-${song.id}`}>
        <Text>{song.title}</Text>
        <Text testID={`is-visible-${song.id}`}>{isVisible.toString()}</Text>
      </View>
    );
  };
});

describe("QuickListenList", () => {
  const mockSongs: Song[] = [
    {
      id: "1",
      title: "Song 1",
      author: "Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "https://example.com/song1.mp3",
    },
    {
      id: "2",
      title: "Song 2",
      author: "Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "https://example.com/song2.mp3",
    },
    {
      id: "3",
      title: "Song 3",
      author: "Artist 3",
      image_path: "https://example.com/image3.jpg",
      song_path: "https://example.com/song3.mp3",
    },
  ];

  it("曲のリストをレンダリングすること", () => {
    const { getByText } = render(
      <QuickListenList
        songs={mockSongs}
        currentIndex={0}
        onIndexChange={jest.fn()}
      />
    );

    expect(getByText("Song 1")).toBeTruthy();
    expect(getByText("Song 2")).toBeTruthy();
    expect(getByText("Song 3")).toBeTruthy();
  });

  it("currentIndex の曲のみ isVisible が true であること", () => {
    const { getByTestId } = render(
      <QuickListenList
        songs={mockSongs}
        currentIndex={0}
        onIndexChange={jest.fn()}
      />
    );

    expect(getByTestId("is-visible-1").children[0]).toBe("true");
    expect(getByTestId("is-visible-2").children[0]).toBe("false");
    expect(getByTestId("is-visible-3").children[0]).toBe("false");
  });

  it("currentIndex が 1 の場合、2曲目のみ isVisible が true であること", () => {
    const { getByTestId } = render(
      <QuickListenList
        songs={mockSongs}
        currentIndex={1}
        onIndexChange={jest.fn()}
      />
    );

    expect(getByTestId("is-visible-1").children[0]).toBe("false");
    expect(getByTestId("is-visible-2").children[0]).toBe("true");
    expect(getByTestId("is-visible-3").children[0]).toBe("false");
  });

  it("isParentFocused が false の場合、null を返すこと", () => {
    const { queryByTestId } = render(
      <QuickListenList
        songs={mockSongs}
        currentIndex={0}
        onIndexChange={jest.fn()}
        isParentFocused={false}
      />
    );

    expect(queryByTestId("quick-listen-item-1")).toBeNull();
  });
});
