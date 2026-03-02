import React from "react";
import { render } from "@testing-library/react-native";
import GridSkeleton from "@/components/common/GridSkeleton";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("GridSkeleton", () => {
  it("デフォルト設定でレンダリングされる", () => {
    const { getByTestId } = render(<GridSkeleton />);
    expect(getByTestId("grid-skeleton")).toBeTruthy();
  });

  it("デフォルトで6件のカードが表示される", () => {
    const { getAllByTestId } = render(<GridSkeleton />);
    const cards = getAllByTestId(/grid-skeleton-card-/);
    expect(cards).toHaveLength(6);
  });

  it("count プロップで件数を変更できる", () => {
    const { getAllByTestId } = render(<GridSkeleton count={4} />);
    const cards = getAllByTestId(/grid-skeleton-card-/);
    expect(cards).toHaveLength(4);
  });

  it("showHeader=true の場合ヘッダーが表示される", () => {
    const { getByTestId } = render(<GridSkeleton showHeader />);
    expect(getByTestId("grid-skeleton-header")).toBeTruthy();
  });

  it("columns=2（デフォルト）の場合2列レイアウトのコンテナが存在する", () => {
    const { getByTestId } = render(<GridSkeleton />);
    expect(getByTestId("grid-skeleton")).toBeTruthy();
  });
});
