import React from "react";
import { render } from "@testing-library/react-native";
import { LibraryPlaylistsSection } from "@/components/library/LibraryPlaylistsSection";

jest.mock("@shopify/flash-list", () => ({
  FlashList: ({ data, renderItem, ...props }: any) => {
    const { View, Text } = require("react-native");
    return (
      <View testID="flash-list">
        {data?.map((item: any, index: number) => (
          <View key={item.id || index}>
            {renderItem({ item, index })}
          </View>
        ))}
      </View>
    );
  },
}));

jest.mock("lucide-react-native", () => ({
  ListMusic: () => null,
}));

jest.mock("@/components/item/PlaylistItem", () => ({
  __esModule: true,
  default: ({ playlist, onPress }: any) => {
    const { TouchableOpacity, Text } = require("react-native");
    return (
      <TouchableOpacity onPress={() => onPress(playlist)} testID="playlist-item">
        <Text>{playlist.title}</Text>
      </TouchableOpacity>
    );
  },
}));

jest.mock("@/components/library/LibraryEmptyState", () => ({
  LibraryEmptyState: ({ title, subtitle }: any) => {
    const { View, Text } = require("react-native");
    return (
      <View testID="empty-state">
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
      </View>
    );
  },
}));

jest.mock("@/constants/theme", () => ({
  COLORS: {
    primary: "#FF0000",
  },
}));

describe("LibraryPlaylistsSection", () => {
  const mockPlaylists = [
    { id: "1", title: "Playlist 1", user_id: "user1" },
    { id: "2", title: "Playlist 2", user_id: "user1" },
  ];

  it("should render empty state when no playlists", () => {
    const { getByTestId, getByText } = render(
      <LibraryPlaylistsSection playlists={[]} onPlaylistPress={jest.fn()} />
    );

    expect(getByTestId("empty-state")).toBeTruthy();
    expect(getByText("Blank Canvas")).toBeTruthy();
  });

  it("should render playlists when provided", () => {
    const { getByTestId, getByText } = render(
      <LibraryPlaylistsSection
        playlists={mockPlaylists}
        onPlaylistPress={jest.fn()}
      />
    );

    expect(getByTestId("flash-list")).toBeTruthy();
    expect(getByText("Playlist 1")).toBeTruthy();
    expect(getByText("Playlist 2")).toBeTruthy();
  });
});
