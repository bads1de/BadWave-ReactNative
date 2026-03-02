import React from "react";
import { render } from "@testing-library/react-native";
import SongDetailSkeleton from "@/components/common/SongDetailSkeleton";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("SongDetailSkeleton", () => {
  it("コンテナがレンダリングされる", () => {
    const { getByTestId } = render(<SongDetailSkeleton />);
    expect(getByTestId("song-detail-skeleton")).toBeTruthy();
  });

  it("ヒーロー画像エリアが表示される", () => {
    const { getByTestId } = render(<SongDetailSkeleton />);
    expect(getByTestId("song-detail-skeleton-hero")).toBeTruthy();
  });

  it("タイトルエリアが表示される", () => {
    const { getByTestId } = render(<SongDetailSkeleton />);
    expect(getByTestId("song-detail-skeleton-title")).toBeTruthy();
  });

  it("メタ情報エリアが表示される", () => {
    const { getByTestId } = render(<SongDetailSkeleton />);
    expect(getByTestId("song-detail-skeleton-meta")).toBeTruthy();
  });

  it("歌詞エリアが表示される", () => {
    const { getByTestId } = render(<SongDetailSkeleton />);
    expect(getByTestId("song-detail-skeleton-lyrics")).toBeTruthy();
  });
});
