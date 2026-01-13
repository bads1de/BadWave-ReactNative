import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import OnRepeatPlayer from "@/components/onRepeat/player/OnRepeatPlayer";
import { useOnRepeatStore } from "@/hooks/stores/useOnRepeatStore";
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

// OnRepeatPlayerItem をモック
jest.mock("@/components/onRepeat/player/OnRepeatPlayerItem", () => {
  const { View, Text } = require("react-native");
  return ({ song, isVisible }: { song: Song; isVisible: boolean }) => (
    <View testID={`on-repeat-player-item-${song.id}`}>
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

describe("OnRepeatPlayer", () => {
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
    useOnRepeatStore.getState().close();
  });

  describe("表示/非表示", () => {
    it("isVisible が false の場合、何も表示しないこと", () => {
      const { queryByTestId } = render(<OnRepeatPlayer />);
      expect(queryByTestId("on-repeat-player")).toBeNull();
    });

    it("isVisible が true の場合、画面を表示すること", () => {
      // ストアを開いた状態にする
      useOnRepeatStore.getState().open(mockSongs, 0);

      const { getByTestId } = render(<OnRepeatPlayer />);
      expect(getByTestId("on-repeat-player")).toBeTruthy();
    });
  });

  describe("閉じるボタン", () => {
    it("閉じるボタンを表示すること", () => {
      useOnRepeatStore.getState().open(mockSongs, 0);

      const { getByTestId } = render(<OnRepeatPlayer />);
      expect(getByTestId("close-button")).toBeTruthy();
    });

    it("閉じるボタン押下時に画面が閉じること", () => {
      useOnRepeatStore.getState().open(mockSongs, 0);

      const { getByTestId, queryByTestId } = render(<OnRepeatPlayer />);

      fireEvent.press(getByTestId("close-button"));

      // ストアの状態を確認
      expect(useOnRepeatStore.getState().isVisible).toBe(false);
    });
  });

  describe("曲リストの表示", () => {
    it("曲リストを表示すること", () => {
      useOnRepeatStore.getState().open(mockSongs, 0);

      const { getByText } = render(<OnRepeatPlayer />);

      expect(getByText("Song 1")).toBeTruthy();
      expect(getByText("Song 2")).toBeTruthy();
    });
  });
});

