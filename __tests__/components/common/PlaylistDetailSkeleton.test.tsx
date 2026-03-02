import React from "react";
import { render } from "@testing-library/react-native";
import PlaylistDetailSkeleton from "@/components/common/PlaylistDetailSkeleton";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("PlaylistDetailSkeleton", () => {
  it("コンテナがレンダリングされる", () => {
    const { getByTestId } = render(<PlaylistDetailSkeleton />);
    expect(getByTestId("playlist-detail-skeleton")).toBeTruthy();
  });

  it("ヒーローセクションが表示される", () => {
    const { getByTestId } = render(<PlaylistDetailSkeleton />);
    expect(getByTestId("playlist-detail-skeleton-hero")).toBeTruthy();
  });

  it("情報カードセクションが表示される", () => {
    const { getByTestId } = render(<PlaylistDetailSkeleton />);
    expect(getByTestId("playlist-detail-skeleton-info")).toBeTruthy();
  });

  it("デフォルトで曲リストアイテムが表示される", () => {
    const { getAllByTestId } = render(<PlaylistDetailSkeleton />);
    const items = getAllByTestId(/playlist-detail-skeleton-item-/);
    expect(items.length).toBeGreaterThanOrEqual(3);
  });

  it("songCount プロップで曲の件数を変更できる", () => {
    const { getAllByTestId } = render(<PlaylistDetailSkeleton songCount={2} />);
    const items = getAllByTestId(/playlist-detail-skeleton-item-/);
    expect(items).toHaveLength(2);
  });
});
