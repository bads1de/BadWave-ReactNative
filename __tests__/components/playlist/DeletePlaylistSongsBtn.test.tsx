import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import DeletePlaylistSongsBtn from "@/components/playlist/DeletePlaylistSongsBtn";
import { useMutatePlaylistSong } from "@/hooks/mutations/useMutatePlaylistSong";
import { useAuth } from "@/providers/AuthProvider";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));
jest.mock("@/hooks/mutations/useMutatePlaylistSong", () => ({
  useMutatePlaylistSong: jest.fn(),
}));
jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

const Toast = require("react-native-toast-message").default;
const mockMutate = jest.fn();

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
    (useAuth as jest.Mock).mockReturnValue({ session: { user: { id: "u1" } } });
    (useMutatePlaylistSong as jest.Mock).mockReturnValue({
      removeSong: { mutate: mockMutate },
    });
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
      expect(mockMutate).toHaveBeenCalledWith(
        { playlistId: "playlist1", songId: "song1" },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
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

    const mutationOptions = mockMutate.mock.calls[0][1];
    mutationOptions.onSuccess();

    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: "success",
        text1: "曲を削除しました",
      });
    });
  });

  it("disables button while deleting", async () => {
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

    const mutationOptions = mockMutate.mock.calls[0][1];
    mutationOptions.onSuccess();

    await waitFor(() => expect(mockMutate).toHaveBeenCalled());
  });
});

