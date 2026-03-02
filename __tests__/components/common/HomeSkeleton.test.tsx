import React from "react";
import { render } from "@testing-library/react-native";
import HomeSkeleton from "@/components/common/HomeSkeleton";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("HomeSkeleton", () => {
  it("home-skeleton コンテナがレンダリングされる", () => {
    const { getByTestId } = render(<HomeSkeleton />);
    expect(getByTestId("home-skeleton")).toBeTruthy();
  });

  it("複数の skeleton-card が表示される", () => {
    const { getAllByTestId } = render(<HomeSkeleton />);
    // SectionSkeleton は 3 つあり、各セクションに count 個のカードが含まれる
    const cards = getAllByTestId(/skeleton-card-/);
    expect(cards.length).toBeGreaterThanOrEqual(3);
  });
});
