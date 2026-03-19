import React from "react";
import { StyleSheet, View } from "react-native";
import { render } from "@testing-library/react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListItemOptionsSheet } from "@/components/item/ListItemOptionsMenu";
import Song from "@/types";

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const { View } = require("react-native");
  const MockIcon = (props: any) => React.createElement(View, props);

  return {
    Heart: MockIcon,
    PlusCircle: MockIcon,
    Download: MockIcon,
    Trash2: MockIcon,
    CloudOff: MockIcon,
    MoreVertical: MockIcon,
  };
});

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("@/hooks/downloads/useDownloadStatus", () => ({
  useDownloadStatus: jest.fn(() => ({ data: false })),
  useDownloadSong: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useDeleteDownloadedSong: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));

jest.mock("@/hooks/data/useLikeStatus", () => ({
  useLikeStatus: jest.fn(() => ({ isLiked: false })),
}));

jest.mock("@/hooks/mutations/useLikeMutation", () => ({
  useLikeMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    session: {
      user: { id: "user-1" },
    },
  })),
}));

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        text: "#ffffff",
        subText: "#999999",
        background: "#000000",
        border: "#222222",
        error: "#ff4444",
        card: "#111111",
        primary: "#00ffaa",
      },
    }),
  ),
}));

jest.mock("@/components/playlist/AddPlaylist", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
  };
});

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
  },
}));

describe("ListItemOptionsSheet", () => {
  const mockSong: Song = {
    id: "song-1",
    user_id: "user-1",
    title: "Test Song",
    author: "Test Author",
    song_path: "song-path",
    image_path: "image-path",
    count: "10",
    like_count: "5",
    created_at: "2024-01-01",
  };

  beforeEach(() => {
    (useSafeAreaInsets as jest.Mock).mockReturnValue({
      top: 0,
      right: 0,
      bottom: 34,
      left: 0,
    });
  });

  it("modal subtree の bottom inset を sheet padding に反映する", () => {
    const { getByTestId } = render(
      <ListItemOptionsSheet song={mockSong} visible onClose={jest.fn()} />,
    );

    const sheetStyle = StyleSheet.flatten(
      getByTestId("song-options-sheet").props.style,
    );

    expect(sheetStyle.paddingBottom).toBe(54);
  });

  it("song が null の場合は何も描画しない", () => {
    const { queryByTestId } = render(
      <ListItemOptionsSheet song={null} visible onClose={jest.fn()} />,
    );

    expect(queryByTestId("song-options-sheet")).toBeNull();
  });
});
