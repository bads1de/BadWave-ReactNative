import React from "react";
import { render } from "@testing-library/react-native";
import SkeletonBox from "@/components/common/SkeletonBox";

// react-native-reanimated をモック
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("SkeletonBox", () => {
  it("デフォルトの testID でレンダリングされる", () => {
    const { getByTestId } = render(<SkeletonBox height={40} />);
    expect(getByTestId("skeleton-box")).toBeTruthy();
  });

  it("カスタム testID でレンダリングされる", () => {
    const { getByTestId } = render(
      <SkeletonBox height={40} testID="my-skeleton" />,
    );
    expect(getByTestId("my-skeleton")).toBeTruthy();
  });

  it("width と height が props として渡される", () => {
    const { getByTestId } = render(
      <SkeletonBox width={120} height={60} testID="sized-skeleton" />,
    );
    const box = getByTestId("sized-skeleton");
    expect(box.props.style).toBeDefined();
  });
});
