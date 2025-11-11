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
    const { UNSAFE_getByType } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    expect(UNSAFE_getByType("TouchableOpacity")).toBeTruthy();
  });

  it("calls delete function when button is pressed", async () => {
    const { UNSAFE_getByType } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    const button = UNSAFE_getByType("TouchableOpacity");
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
    const { UNSAFE_getByType } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    fireEvent.press(UNSAFE_getByType("TouchableOpacity"));

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "success",
        text1: "曲を削除しました",
      });
    });
  });

  it("disables button while deleting", async () => {
    const { UNSAFE_getByType } = render(
      <DeletePlaylistSongsBtn
        songId="song1"
        playlistId="playlist1"
        songType="regular"
      />,
      { wrapper }
    );

    const button = UNSAFE_getByType("TouchableOpacity");
    fireEvent.press(button);

    // ボタンが無効化されていることを確認
    expect(button.props.disabled).toBeTruthy();
  });
});
