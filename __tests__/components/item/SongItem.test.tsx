import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import SongItem from "@/components/item/SongItem";
import Song from "@/types";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";

// モック
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
}));
jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("@/components/common/MarqueeText", () => "MarqueeText");
jest.mock("@/components/download/DownloadButton", () => ({
  DownloadButton: "DownloadButton",
}));
jest.mock("@/components/item/ListItemOptionsMenu", () => "ListItemOptionsMenu");

const mockUseNetworkStatus = useNetworkStatus as jest.Mock;

describe("SongItem Component", () => {
  const mockSong: Song = {
    id: "s1",
    user_id: "u1",
    title: "Test Song",
    author: "Test Author",
    song_path: "path",
    image_path: "image-path",
    count: "100",
    like_count: "50",
    created_at: "2024-01-01",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
  });

  it("基本情報が表示される", () => {
    const { getByText } = render(
      <SongItem song={mockSong} onClick={jest.fn()} />,
    );

    expect(getByText("Test Author")).toBeTruthy();
    expect(getByText("100")).toBeTruthy();
    expect(getByText("50")).toBeTruthy();
    // title は MarqueeText なので queryByText("Test Song") はモックに依存
  });

  it("オンライン時: 押下で onClick が呼ばれる", () => {
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <SongItem song={mockSong} onClick={onClickMock} />,
    );

    fireEvent.press(getByTestId("song-container"));
    expect(onClickMock).toHaveBeenCalledWith(mockSong.id);
  });

  it("オフラインかつ未ダウンロード: 無効化され onClick が呼ばれない", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <SongItem
        song={{ ...mockSong, local_song_path: undefined }}
        onClick={onClickMock}
      />,
    );

    const container = getByTestId("song-container");
    fireEvent.press(container);

    expect(onClickMock).not.toHaveBeenCalled();
    // disabled プロパティが渡されているか
    expect(container.props.accessibilityState.disabled).toBe(true);
  });

  it("オフラインでもダウンロード済みなら有効", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });
    const onClickMock = jest.fn();
    const { getByTestId } = render(
      <SongItem
        song={{ ...mockSong, local_song_path: "file://local" }}
        onClick={onClickMock}
      />,
    );

    const container = getByTestId("song-container");
    fireEvent.press(container);

    expect(onClickMock).toHaveBeenCalled();
    expect(container.props.accessibilityState.disabled).toBeFalsy();
  });
});
