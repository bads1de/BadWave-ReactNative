import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import OnRepeatPlayerControls from "@/components/onRepeat/player/OnRepeatPlayerControls";
import Song from "@/types";

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
      expect(getByTestId("like-button")).toBeTruthy();
    });

    it("プレイリストに追加ボタンを表示すること", () => {
      const { getByTestId } = render(
        <OnRepeatPlayerControls song={mockSong} />
      );
      expect(getByTestId("add-to-playlist-button")).toBeTruthy();
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

  describe("ボタンのコールバック", () => {
    it("いいねボタン押下時に onLike が呼ばれること", () => {
      const onLike = jest.fn();
      const { getByTestId } = render(
        <OnRepeatPlayerControls song={mockSong} onLike={onLike} />
      );

      fireEvent.press(getByTestId("like-button"));
      expect(onLike).toHaveBeenCalledTimes(1);
    });

    it("プレイリスト追加ボタン押下時に onAddToPlaylist が呼ばれること", () => {
      const onAddToPlaylist = jest.fn();
      const { getByTestId } = render(
        <OnRepeatPlayerControls
          song={mockSong}
          onAddToPlaylist={onAddToPlaylist}
        />
      );

      fireEvent.press(getByTestId("add-to-playlist-button"));
      expect(onAddToPlaylist).toHaveBeenCalledTimes(1);
    });

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
