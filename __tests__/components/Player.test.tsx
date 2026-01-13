import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import Player from "@/components/player/Player";

// react-native-track-playerのモック
jest.mock("react-native-track-player", () => ({
  RepeatMode: {
    Off: 0,
    Track: 1,
    Queue: 2,
  },
  useProgress: jest.fn(() => ({ position: 0, duration: 0 })),
  usePlaybackState: jest.fn(() => ({ state: "paused" })),
  useActiveTrack: jest.fn(() => null),
  play: jest.fn(),
  pause: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  seekTo: jest.fn(),
  setRepeatMode: jest.fn(),
}));

// RepeatModeをインポート
const { RepeatMode } = require("react-native-track-player");

// モックの設定
jest.mock("expo-image", () => ({
  ImageBackground: "ImageBackground",
}));

jest.mock("expo-av", () => ({
  ResizeMode: {
    COVER: "cover",
  },
  Video: "Video",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(() => ({
    muted: false,
    loop: false,
    play: jest.fn(),
  })),
}));

jest.mock("@react-native-community/slider", () => "Slider");

jest.mock("@/components/player/NextSong", () => "NextSong");
jest.mock("@/components/player/lyric", () => "Lyric");
jest.mock("@/components/LikeButton", () => ({
  __esModule: true,
  default: "LikeButton",
}));
jest.mock("@/components/playlist/AddPlaylist", () => ({
  __esModule: true,
  default: "AddPlaylist",
}));
jest.mock("@/components/onRepeat/OnRepeat", () => ({
  __esModule: true,
  default: "OnRepeat",
}));
jest.mock("@/components/common/MarqueeText", () => {
  const React = require("react");
  const { Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ text }: any) => React.createElement(Text, null, text),
  };
});

describe("Player", () => {
  // テスト用のモックデータ
  const mockSong = {
    id: "song1",
    title: "テスト曲",
    author: "テストアーティスト",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    video_path: null,
    lyrics: null,
  };

  // テスト用のモックプロップス
  const mockProps = {
    isPlaying: false,
    currentSong: mockSong,
    position: 30000, // 30秒
    duration: 180000, // 3分
    onPlayPause: jest.fn(),
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSeek: jest.fn(),
    onClose: jest.fn(),
    repeatMode: RepeatMode.Off,
    setRepeatMode: jest.fn(),
    shuffle: false,
    setShuffle: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("正しく曲情報を表示する", () => {
    const { getByText } = render(<Player {...mockProps} />);

    expect(getByText("テスト曲")).toBeTruthy();
    expect(getByText("テストアーティスト")).toBeTruthy();
  });

  it("再生/一時停止ボタンをタップすると適切な関数が呼ばれる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    fireEvent.press(getByTestId("play-pause-button"));

    expect(mockProps.onPlayPause).toHaveBeenCalledTimes(1);
  });

  it("次へボタンをタップすると適切な関数が呼ばれる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    fireEvent.press(getByTestId("next-button"));

    expect(mockProps.onNext).toHaveBeenCalledTimes(1);
  });

  it("前へボタンをタップすると適切な関数が呼ばれる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    fireEvent.press(getByTestId("prev-button"));

    expect(mockProps.onPrev).toHaveBeenCalledTimes(1);
  });

  it("閉じるボタンをタップすると適切な関数が呼ばれる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    fireEvent.press(getByTestId("close-button"));

    expect(mockProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("シャッフルボタンをタップするとシャッフル状態が切り替わる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    fireEvent.press(getByTestId("shuffle-button"));

    expect(mockProps.setShuffle).toHaveBeenCalledWith(!mockProps.shuffle);
  });

  it("リピートボタンをタップするとリピートモードが切り替わる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    fireEvent.press(getByTestId("repeat-button"));

    // RepeatMode.Off から RepeatMode.Track に切り替わる
    expect(mockProps.setRepeatMode).toHaveBeenCalledWith(RepeatMode.Track);
  });

  it("スライダーを操作すると適切な関数が呼ばれる", () => {
    const { getByTestId } = render(<Player {...mockProps} />);

    // スライダーの値変更をシミュレート
    fireEvent(getByTestId("seek-slider"), "onSlidingComplete", 60000); // 1分

    expect(mockProps.onSeek).toHaveBeenCalledWith(60000);
  });

  it("ビデオパスがある場合はビデオコンポーネントをレンダリングする", () => {
    const songWithVideo = {
      ...mockSong,
      video_path: "https://example.com/video.mp4",
    };

    const propsWithVideo = {
      ...mockProps,
      currentSong: songWithVideo,
    };

    const { getByTestId } = render(<Player {...propsWithVideo} />);

    expect(getByTestId("background-video")).toBeTruthy();
  });

  it("歌詞がある場合は歌詞コンポーネントをレンダリングする", () => {
    const songWithLyrics = {
      ...mockSong,
      lyrics: "テスト歌詞",
    };

    const propsWithLyrics = {
      ...mockProps,
      currentSong: songWithLyrics,
    };

    const { getByTestId } = render(<Player {...propsWithLyrics} />);

    expect(getByTestId("lyrics-component")).toBeTruthy();
  });
});
