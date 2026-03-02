import React from "react";
import { render } from "@testing-library/react-native";
import { View } from "react-native";
import Loading from "@/components/common/Loading";

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn(() => ({
    colors: {
      primary: "#8b5cf6",
      background: "#000000",
    },
  })),
}));

// HomeSkeleton は reanimated を使うため、このテストファイルではモック化しておく
jest.mock("@/components/common/HomeSkeleton", () => {
  const { View } = require("react-native");
  return () => <View testID="home-skeleton-mock" />;
});

describe("Loading", () => {
  it("デフォルトでローディングインジケータが表示される", () => {
    const { getByTestId } = render(<Loading />);

    expect(getByTestId("loading-container")).toBeTruthy();
    // ActivityIndicator が描画されていることを確認
    expect(getByTestId("loading-indicator")).toBeTruthy();
  });

  it("カスタムサイズでローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading size="large" />);

    expect(getByTestId("loading-indicator")).toBeTruthy();
    expect(getByTestId("loading-indicator").props.size).toBe("large");
  });

  it("カスタム色でローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading color="#ff0000" />);

    expect(getByTestId("loading-indicator")).toBeTruthy();
    expect(getByTestId("loading-indicator").props.color).toBe("#ff0000");
  });

  it("数値サイズでローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading size={40} />);

    expect(getByTestId("loading-indicator")).toBeTruthy();
    expect(getByTestId("loading-indicator").props.size).toBe(40);
  });

  it("メモ化されたコンポーネントが正しくレンダリングされる", () => {
    const { rerender, getByTestId } = render(<Loading color="#8b5cf6" />);

    expect(getByTestId("loading-indicator").props.color).toBe("#8b5cf6");

    rerender(<Loading color="#ff0000" />);

    expect(getByTestId("loading-indicator").props.color).toBe("#ff0000");
  });

  it('variant="home" のときスケルトンが表示される', () => {
    const { getByTestId, queryByTestId } = render(<Loading variant="home" />);

    expect(getByTestId("home-skeleton-mock")).toBeTruthy();
    // スピナーは表示されない
    expect(queryByTestId("loading-indicator")).toBeNull();
  });
});
