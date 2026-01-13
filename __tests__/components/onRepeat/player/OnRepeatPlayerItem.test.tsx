import React from "react";
import { render } from "@testing-library/react-native";
import OnRepeatPlayerItem from "@/components/onRepeat/player/OnRepeatPlayerItem";
import Song from "@/types";

// expo-video をモック
// expo-video をモック
jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
  })),
}));

// useOnRepeatPlayer をモック
jest.mock("@/hooks/audio/useOnRepeatPlayer", () => ({
  useOnRepeatPlayer: jest.fn(() => ({
    player: { play: jest.fn(), pause: jest.fn() },
    hasVideo: true,
  })),
}));

// フックのモック
jest.mock("@/hooks/data/useLikeStatus", () => ({
  useLikeStatus: jest.fn(() => ({ isLiked: false, isLoading: false })),
}));

jest.mock("@/hooks/mutations/useLikeMutation", () => ({
  useLikeMutation: jest.fn(() => ({ mutate: jest.fn(), isPending: false })),
}));

jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(() => ({ togglePlayPause: jest.fn() })),
}));

const mockClose = jest.fn();
const mockState = {
  songs: [],
  close: mockClose,
};
jest.mock("@/hooks/stores/useOnRepeatStore", () => ({
  useOnRepeatStore: jest.fn((selector) =>
    selector ? selector(mockState) : mockState
  ),
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(() => ({ session: { user: { id: "user1" } } })),
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

// OnRepeatPlayerControls をモック
jest.mock("@/components/onRepeat/player/OnRepeatPlayerControls", () => {
  const { View } = require("react-native");
  return () => <View testID="on-repeat-player-controls" />;
});

describe("OnRepeatPlayerItem", () => {
  const mockSongWithVideo: Song = {
    id: "1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    video_path: "https://example.com/video.mp4",
  };

  describe("基本的なレンダリング", () => {
    it("曲のタイトルを表示すること", () => {
      const { getByText } = render(
        <OnRepeatPlayerItem song={mockSongWithVideo} isVisible={true} />
      );
      expect(getByText("Test Song")).toBeTruthy();
    });

    it("アーティスト名を表示すること", () => {
      const { getByText } = render(
        <OnRepeatPlayerItem song={mockSongWithVideo} isVisible={true} />
      );
      expect(getByText("Test Artist")).toBeTruthy();
    });
  });

  describe("動画/画像の表示", () => {
    it("動画付きの曲の場合、VideoView を表示すること", () => {
      // useOnRepeatPlayer が hasVideo: true を返すようにモック
      const { useOnRepeatPlayer } = require("@/hooks/audio/useOnRepeatPlayer");
      useOnRepeatPlayer.mockReturnValue({
        player: { play: jest.fn(), pause: jest.fn() },
        hasVideo: true,
      });

      const { UNSAFE_getByType } = render(
        <OnRepeatPlayerItem song={mockSongWithVideo} isVisible={true} />
      );

      // VideoViewがレンダリングされることを確認
      expect(UNSAFE_getByType("VideoView")).toBeTruthy();
    });
  });

  describe("コントロールボタン", () => {
    it("OnRepeatPlayerControls を表示すること", () => {
      const { getByTestId } = render(
        <OnRepeatPlayerItem song={mockSongWithVideo} isVisible={true} />
      );
      expect(getByTestId("on-repeat-player-controls")).toBeTruthy();
    });
  });
});
