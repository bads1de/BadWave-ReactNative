import React from "react";
import { render } from "@testing-library/react-native";
import { SettingSection } from "@/components/common/SettingSection";

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        primary: "#FF0000",
        text: "#FFFFFF",
        subText: "#888888",
        border: "#333333",
      },
    })
  ),
}));

describe("SettingSection", () => {
  it("should render with title", () => {
    const { getByText } = render(
      <SettingSection title="General">
        <></>
      </SettingSection>
    );

    expect(getByText("General")).toBeTruthy();
  });

  it("should render children", () => {
    const { getByText } = render(
      <SettingSection title="Section">
        <></>
      </SettingSection>
    );

    expect(getByText("Section")).toBeTruthy();
  });

  it("should render with icon", () => {
    const MockIcon = () => null;
    const { getByText } = render(
      <SettingSection title="With Icon" icon={MockIcon}>
        <></>
      </SettingSection>
    );

    expect(getByText("With Icon")).toBeTruthy();
  });

  it("should render without title", () => {
    const { queryByText } = render(
      <SettingSection>
        <></>
      </SettingSection>
    );

    expect(queryByText("General")).toBeNull();
  });
});
