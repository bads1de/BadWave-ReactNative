import React from "react";
import { render } from "@testing-library/react-native";
import { LibraryLikedSection } from "@/components/library/LibraryLikedSection";

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

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

jest.mock("lucide-react-native", () => ({
  Heart: () => null,
}));

jest.mock("@/components/item/SongItem", () => {
  const { View, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ song }: any) => (
      <View testID="song-item">
        <Text>{song.title}</Text>
      </View>
    ),
  };
});

jest.mock("@/components/download/BulkDownloadButton", () => ({
  BulkDownloadButton: () => null,
}));

jest.mock("@/components/library/LibraryEmptyState", () => {
  const { View, Text } = require("react-native");
  return {
    LibraryEmptyState: ({ title, subtitle }: any) => (
      <View testID="empty-state">
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
      </View>
    ),
  };
});

jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  usePlayControls: jest.fn(() => ({
    togglePlayPause: jest.fn(),
  })),
}));

jest.mock("@/hooks/common/useStableCallback", () => ({
  useStableCallback: (fn: any) => fn,
}));

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        subText: "#888888",
      },
    })
  ),
}));

jest.mock("@/constants/theme", () => ({
  COLORS: {
    primary: "#FF0000",
  },
  FONTS: {
    semibold: "System",
  },
}));

describe("LibraryLikedSection", () => {
  const mockSongs = [
    { id: "1", title: "Song 1", author: "Artist 1" },
    { id: "2", title: "Song 2", author: "Artist 2" },
  ] as any;

  it("should render empty state when no songs", () => {
    const { getByTestId, getByText } = render(
      <LibraryLikedSection
        songs={[]}
        isOnline={true}
        onOpenSongOptions={jest.fn()}
      />
    );

    expect(getByTestId("empty-state")).toBeTruthy();
    expect(getByText("Pure Silence")).toBeTruthy();
  });

  it("should render songs when provided", () => {
    const { getByTestId, getByText } = render(
      <LibraryLikedSection
        songs={mockSongs}
        isOnline={true}
        onOpenSongOptions={jest.fn()}
      />
    );

    expect(getByTestId("flash-list")).toBeTruthy();
    expect(getByText("Song 1")).toBeTruthy();
    expect(getByText("Song 2")).toBeTruthy();
  });

  it("should show track count", () => {
    const { getByText } = render(
      <LibraryLikedSection
        songs={mockSongs}
        isOnline={true}
        onOpenSongOptions={jest.fn()}
      />
    );

    expect(getByText("2 Tracks")).toBeTruthy();
  });
});
