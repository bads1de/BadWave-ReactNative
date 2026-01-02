import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ListItemOptionsMenu from "@/components/item/ListItemOptionsMenu";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

jest.mock("@/hooks/downloads/useDownloadStatus", () => ({
  useDownloadStatus: () => ({ data: false }),
  useDownloadSong: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteDownloadedSong: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: () => ({ isOnline: true }),
}));

jest.mock("@/hooks/data/useLikeStatus", () => ({
  useLikeStatus: () => ({ isLiked: false, isLoading: false }),
}));

jest.mock("@/hooks/mutations/useLikeMutation", () => ({
  useLikeMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: () => ({ session: { user: { id: "user-123" } } }),
}));

jest.mock("@/components/playlist/AddPlaylist", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));

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

describe("ListItemOptionsMenu", () => {
  it("renders menu button", () => {
    const { getByTestId } = render(<ListItemOptionsMenu song={mockSong} />);

    expect(getByTestId("menu-button")).toBeTruthy();
  });

  it("opens modal and shows options when menu button is pressed", () => {
    const { getByTestId, getByText } = render(
      <ListItemOptionsMenu song={mockSong} />
    );

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    // いいねオプション
    expect(getByText("いいね")).toBeTruthy();
    // プレイリストに追加オプション
    expect(getByText("プレイリストに追加")).toBeTruthy();
    // ダウンロードオプション
    expect(getByText("ダウンロード")).toBeTruthy();
  });

  it("shows delete option when onDelete is provided", () => {
    const mockOnDelete = jest.fn();
    const { getByTestId, getByText } = render(
      <ListItemOptionsMenu song={mockSong} onDelete={mockOnDelete} />
    );

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(getByText("プレイリストから削除")).toBeTruthy();
  });

  it("calls onDelete when delete option is pressed", () => {
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <ListItemOptionsMenu song={mockSong} onDelete={mockOnDelete} />
    );

    // メニューボタンを押してモーダルを開く
    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    // 削除ボタンを押す
    const deleteButton = getByTestId("delete-option");
    fireEvent.press(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("does not show playlist delete option when onDelete is not provided", () => {
    const { getByTestId, queryByText } = render(
      <ListItemOptionsMenu song={mockSong} />
    );

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(queryByText("プレイリストから削除")).toBeNull();
  });

  it("shows download option when song is not downloaded", () => {
    const { getByTestId } = render(<ListItemOptionsMenu song={mockSong} />);

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(getByTestId("download-option")).toBeTruthy();
  });

  it("shows like option for authenticated users", () => {
    const { getByTestId } = render(<ListItemOptionsMenu song={mockSong} />);

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(getByTestId("like-option")).toBeTruthy();
  });

  it("shows add-to-playlist option for authenticated users", () => {
    const { getByTestId } = render(<ListItemOptionsMenu song={mockSong} />);

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(getByTestId("add-to-playlist-option")).toBeTruthy();
  });
});

