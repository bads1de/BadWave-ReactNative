import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import QuickListenScreen from "@/components/quickListen/QuickListenScreen";
import { useQuickListenStore } from "@/hooks/stores/useQuickListenStore";
import Song from "@/types";

// FlashList をモック
jest.mock("@shopify/flash-list", () => {
  const { View } = require("react-native");
  return {
    FlashList: ({ data, renderItem }: any) => (
      <View testID="flash-list">
        {data.map((item: any, index: number) => renderItem({ item, index }))}
      </View>
    ),
  };
});

// QuickListenItem をモック
jest.mock("@/components/quickListen/QuickListenItem", () => {
  const { View, Text } = require("react-native");
  return ({ song, isVisible }: { song: Song; isVisible: boolean }) => (
    <View testID={`quick-listen-item-${song.id}`}>
      <Text>{song.title}</Text>
    </View>
  );
});

// expo-blur をモック
jest.mock("expo-blur", () => {
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
  };
});

describe("QuickListenScreen", () => {
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
  ];

  beforeEach(() => {
    // ストアを初期化
    useQuickListenStore.getState().close();
  });

  describe("表示/非表示", () => {
    it("isVisible が false の場合、何も表示しないこと", () => {
      const { queryByTestId } = render(<QuickListenScreen />);
      expect(queryByTestId("quick-listen-screen")).toBeNull();
    });

    it("isVisible が true の場合、画面を表示すること", () => {
      // ストアを開いた状態にする
      useQuickListenStore.getState().open(mockSongs, 0);

      const { getByTestId } = render(<QuickListenScreen />);
      expect(getByTestId("quick-listen-screen")).toBeTruthy();
    });
  });

  describe("閉じるボタン", () => {
    it("閉じるボタンを表示すること", () => {
      useQuickListenStore.getState().open(mockSongs, 0);

      const { getByTestId } = render(<QuickListenScreen />);
      expect(getByTestId("close-button")).toBeTruthy();
    });

    it("閉じるボタン押下時に画面が閉じること", () => {
      useQuickListenStore.getState().open(mockSongs, 0);

      const { getByTestId, queryByTestId } = render(<QuickListenScreen />);

      fireEvent.press(getByTestId("close-button"));

      // ストアの状態を確認
      expect(useQuickListenStore.getState().isVisible).toBe(false);
    });
  });

  describe("曲リストの表示", () => {
    it("曲リストを表示すること", () => {
      useQuickListenStore.getState().open(mockSongs, 0);

      const { getByText } = render(<QuickListenScreen />);

      expect(getByText("Song 1")).toBeTruthy();
      expect(getByText("Song 2")).toBeTruthy();
    });
  });
});
