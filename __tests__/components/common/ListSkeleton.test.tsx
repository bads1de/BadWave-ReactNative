import React from "react";
import { render } from "@testing-library/react-native";
import ListSkeleton from "@/components/common/ListSkeleton";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("ListSkeleton", () => {
  it("デフォルト設定でレンダリングされる", () => {
    const { getByTestId } = render(<ListSkeleton />);
    expect(getByTestId("list-skeleton")).toBeTruthy();
  });

  it("デフォルトで5件のアイテムが表示される", () => {
    const { getAllByTestId } = render(<ListSkeleton />);
    const items = getAllByTestId(/list-skeleton-item-/);
    expect(items).toHaveLength(5);
  });

  it("count プロップで件数を変更できる", () => {
    const { getAllByTestId } = render(<ListSkeleton count={3} />);
    const items = getAllByTestId(/list-skeleton-item-/);
    expect(items).toHaveLength(3);
  });

  it("showAvatar=false の場合アバターが表示されない", () => {
    const { queryAllByTestId } = render(<ListSkeleton showAvatar={false} />);
    const avatars = queryAllByTestId(/list-skeleton-avatar-/);
    expect(avatars).toHaveLength(0);
  });

  it("showAvatar=true（デフォルト）の場合アバターが表示される", () => {
    const { getAllByTestId } = render(<ListSkeleton showAvatar={true} />);
    const avatars = getAllByTestId(/list-skeleton-avatar-/);
    expect(avatars.length).toBeGreaterThanOrEqual(1);
  });

  it("showHeader=true の場合ヘッダーが表示される", () => {
    const { getByTestId } = render(<ListSkeleton showHeader />);
    expect(getByTestId("list-skeleton-header")).toBeTruthy();
  });

  it("showHeader=false（デフォルト）の場合ヘッダーが表示されない", () => {
    const { queryByTestId } = render(<ListSkeleton />);
    expect(queryByTestId("list-skeleton-header")).toBeNull();
  });
});
