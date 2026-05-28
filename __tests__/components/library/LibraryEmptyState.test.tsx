import React from "react";
import { render } from "@testing-library/react-native";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        text: "#FFFFFF",
        subText: "#888888",
      },
    })
  ),
}));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

describe("LibraryEmptyState", () => {
  it("should render with title and subtitle", () => {
    const { getByText } = render(
      <LibraryEmptyState
        icon={<></>}
        title="No Items"
        subtitle="Add some items to get started"
      />
    );

    expect(getByText("No Items")).toBeTruthy();
    expect(getByText("Add some items to get started")).toBeTruthy();
  });

  it("should render with custom icon", () => {
    const CustomIcon = () => null;
    const { getByText } = render(
      <LibraryEmptyState
        icon={<CustomIcon />}
        title="Empty"
        subtitle="Nothing here"
      />
    );

    expect(getByText("Empty")).toBeTruthy();
  });
});
