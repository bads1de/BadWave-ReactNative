import React from "react";
import { render } from "@testing-library/react-native";
import QuickListenItem from "@/components/quickListen/QuickListenItem";
import Song from "@/types";

// expo-video をモック
jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
  })),
}));

// useQuickListenPlayer をモック
jest.mock("@/hooks/useQuickListenPlayer", () => ({
  useQuickListenPlayer: jest.fn(() => ({
    player: { play: jest.fn(), pause: jest.fn() },
    hasVideo: true,
  })),
}));

// QuickListenControls をモック
jest.mock("@/components/quickListen/QuickListenControls", () => {
  const { View } = require("react-native");
  return () => <View testID="quick-listen-controls" />;
});

describe("QuickListenItem", () => {
  const mockSongWithVideo: Song = {
    id: "1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    video_path: "https://example.com/video.mp4",
  };

  const mockSongWithoutVideo: Song = {
    id: "2",
    title: "Audio Only Song",
    author: "Audio Artist",
    image_path: "https://example.com/image2.jpg",
    song_path: "https://example.com/song2.mp3",
  };

  describe("基本的なレンダリング", () => {
    it("曲のタイトルを表示すること", () => {
      const { getByText } = render(
        <QuickListenItem song={mockSongWithVideo} isVisible={true} />
      );
      expect(getByText("Test Song")).toBeTruthy();
    });

    it("アーティスト名を表示すること", () => {
      const { getByText } = render(
        <QuickListenItem song={mockSongWithVideo} isVisible={true} />
      );
      expect(getByText("Test Artist")).toBeTruthy();
    });
  });

  describe("動画/画像の表示", () => {
    it("動画付きの曲の場合、VideoView を表示すること", () => {
      // useQuickListenPlayer が hasVideo: true を返すようにモック
      const { useQuickListenPlayer } = require("@/hooks/useQuickListenPlayer");
      useQuickListenPlayer.mockReturnValue({
        player: { play: jest.fn(), pause: jest.fn() },
        hasVideo: true,
      });

      const { UNSAFE_getByType } = render(
        <QuickListenItem song={mockSongWithVideo} isVisible={true} />
      );

      // VideoViewがレンダリングされることを確認
      expect(UNSAFE_getByType("VideoView")).toBeTruthy();
    });
  });

  describe("コントロールボタン", () => {
    it("QuickListenControls を表示すること", () => {
      const { getByTestId } = render(
        <QuickListenItem song={mockSongWithVideo} isVisible={true} />
      );
      expect(getByTestId("quick-listen-controls")).toBeTruthy();
    });
  });
});
