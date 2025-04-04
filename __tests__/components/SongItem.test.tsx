import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SongItem from "../../components/SongItem";
import { useRouter } from "expo-router";

// モックの設定
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  // アニメーションスタイルのモック
  Reanimated.useAnimatedStyle = () => ({});
  Reanimated.useSharedValue = jest.fn().mockReturnValue(0);
  Reanimated.withTiming = jest.fn().mockReturnValue(1);
  Reanimated.withSpring = jest.fn().mockReturnValue(1);
  return {
    ...Reanimated,
    default: {
      ...Reanimated,
      View: "Animated.View",
    },
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("../../components/DownloadButton", () => ({
  DownloadButton: "DownloadButton",
}));

describe("SongItem", () => {
  // テスト用のモックデータ
  const mockSong = {
    id: "song1",
    user_id: "user1",
    title: "テスト曲",
    author: "テストアーティスト",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    count: "100",
    like_count: "50",
    created_at: "2023-01-01",
  };

  // モックルーターの設定
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
  });

  it("正しく曲情報を表示する", () => {
    const mockOnClick = jest.fn();
    const { getByText } = render(
      <SongItem song={mockSong} onClick={mockOnClick} />
    );

    expect(getByText("テスト曲")).toBeTruthy();
    expect(getByText("テストアーティスト")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
  });

  it("曲をクリックすると適切な関数が呼ばれる", () => {
    const mockOnClick = jest.fn();
    const { getByTestId } = render(
      <SongItem song={mockSong} onClick={mockOnClick} />
    );

    // 曲のコンテナをクリック
    fireEvent.press(getByTestId("song-container"));

    expect(mockOnClick).toHaveBeenCalledWith(mockSong.id);
  });

  it("タイトルをクリックするとルーターのpushが呼ばれる", () => {
    const mockOnClick = jest.fn();
    const { getByTestId } = render(
      <SongItem song={mockSong} onClick={mockOnClick} />
    );

    // タイトルをクリック
    fireEvent.press(getByTestId("song-title-button"));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: `/song/[songId]`,
      params: { songId: mockSong.id },
    });
  });

  it("dynamicSizeがtrueの場合、サイズが動的に計算される", () => {
    const mockOnClick = jest.fn();
    const { getByText } = render(
      <SongItem song={mockSong} onClick={mockOnClick} dynamicSize={true} />
    );

    // コンポーネントが正しくレンダリングされていることを確認
    expect(getByText("テスト曲")).toBeTruthy();
  });

  it("songTypeを指定できる", () => {
    const mockOnClick = jest.fn();
    const { getByText } = render(
      <SongItem song={mockSong} onClick={mockOnClick} songType="suno" />
    );

    // コンポーネントが正しくレンダリングされていることを確認
    expect(getByText("テスト曲")).toBeTruthy();
  });
});
