import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DeletePlaylistSongsBtn from "@/components/playlist/DeletePlaylistSongsBtn";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

jest.mock("@/actions/deletePlaylistSong", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const Toast = require("react-native-toast-message").default;
const deletePlaylistSong = require("@/actions/deletePlaylistSong").default;

describe("DeletePlaylistSongsBtn", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    deletePlaylistSong.mockResolvedValue(undefined);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders delete button", () => {
    const { getByTestId } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    expect(getByTestId("delete-playlist-song-button")).toBeTruthy();
  });

  it("calls delete function when button is pressed", async () => {
    const { getByTestId } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    const button = getByTestId("delete-playlist-song-button");
    fireEvent.press(button);

    await waitFor(() => {
      expect(deletePlaylistSong).toHaveBeenCalledWith(
        "playlist1",
        "song1",
        "regular"
      );
    });
  });

  it("shows success toast on successful deletion", async () => {
    const { getByTestId } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    fireEvent.press(getByTestId("delete-playlist-song-button"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "success",
        text1: "曲を削除しました",
      });
    });
  });

  it("disables button while deleting", async () => {
    // 遅延をシミュレート
    deletePlaylistSong.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { getByTestId } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    const button = getByTestId("delete-playlist-song-button");
    fireEvent.press(button);

    // 即座に無効化されていることを確認
    await waitFor(() => {
      const updatedButton = getByTestId("delete-playlist-song-button");
      expect(
        updatedButton.props.disabled ||
          updatedButton.props.accessibilityState?.disabled
      ).toBeTruthy();
    });

    // 処理完了を待つ
    await waitFor(() => expect(deletePlaylistSong).toHaveBeenCalled());
  });
});
