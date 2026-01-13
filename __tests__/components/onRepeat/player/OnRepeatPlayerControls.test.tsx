import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import OnRepeatPlayerControls from "@/components/onRepeat/player/OnRepeatPlayerControls";
import Song from "@/types";

// LikeButton をモック
jest.mock("@/components/LikeButton", () => {
  const { View } = require("react-native");
  return () => <View testID="like-button-mock" />;
});

// AddPlaylist をモック
jest.mock("@/components/playlist/AddPlaylist", () => {
  const { View } = require("react-native");
  return ({ children }: { children: React.ReactNode }) => (
    <View testID="add-playlist-mock">{children}</View>
  );
});

describe("OnRepeatPlayerControls", () => {
  const mockSong: Song = {
    id: "1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
  };

  describe("ボタンのレンダリング", () => {
    it("いいねボタンを表示すること", () => {
      const { getByTestId } = render(
        <OnRepeatPlayerControls song={mockSong} />
      );
      expect(getByTestId("like-button-mock")).toBeTruthy();
    });

    it("プレイリスト追加コンポーネントを表示すること", () => {
      const { getByTestId } = render(
        <OnRepeatPlayerControls song={mockSong} />
      );
      expect(getByTestId("add-playlist-mock")).toBeTruthy();
    });

    it("フルで聴くボタンを表示すること", () => {
      const { getByTestId } = render(
        <OnRepeatPlayerControls song={mockSong} />
      );
      expect(getByTestId("play-full-button")).toBeTruthy();
    });

    it("「フルで聴く」テキストを表示すること", () => {
      const { getByText } = render(<OnRepeatPlayerControls song={mockSong} />);
      expect(getByText("フルで聴く")).toBeTruthy();
    });
  });

  describe("ボタンのコールバックと状態", () => {
    it("フルで聴くボタン押下時に onPlayFull が呼ばれること", () => {
      const onPlayFull = jest.fn();
      const { getByTestId } = render(
        <OnRepeatPlayerControls song={mockSong} onPlayFull={onPlayFull} />
      );

      fireEvent.press(getByTestId("play-full-button"));
      expect(onPlayFull).toHaveBeenCalledTimes(1);
    });
  });
});
