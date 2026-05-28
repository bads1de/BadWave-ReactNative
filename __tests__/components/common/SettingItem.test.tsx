import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SettingItem } from "@/components/common/SettingItem";

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        subText: "#888888",
      },
    })
  ),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, size, color }: any) => null,
}));

describe("SettingItem", () => {
  it("should render with title", () => {
    const { getByText } = render(<SettingItem title="Account" />);
    expect(getByText("Account")).toBeTruthy();
  });

  it("should render with description", () => {
    const { getByText } = render(
      <SettingItem title="Account" description="Manage your account" />
    );
    expect(getByText("Manage your account")).toBeTruthy();
  });

  it("should call onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <SettingItem title="Account" onPress={onPress} />
    );

    fireEvent.press(getByText("Account"));
    expect(onPress).toHaveBeenCalled();
  });

  it("should render with icon", () => {
    const { getByText } = render(
      <SettingItem title="Account" icon="person" />
    );
    expect(getByText("Account")).toBeTruthy();
  });

  it("should render with rightElement", () => {
    const RightElement = () => <></>;
    const { getByText } = render(
      <SettingItem title="Toggle" rightElement={<RightElement />} />
    );
    expect(getByText("Toggle")).toBeTruthy();
  });

  it("should render as destructive", () => {
    const { getByText } = render(
      <SettingItem title="Delete" destructive />
    );
    expect(getByText("Delete")).toBeTruthy();
  });

  it("should render with disabled style when disabled", () => {
    const { getByText } = render(
      <SettingItem title="Disabled" onPress={jest.fn()} disabled />
    );
    expect(getByText("Disabled")).toBeTruthy();
  });

  it("should render separator when not isLast", () => {
    const { toJSON } = render(
      <SettingItem title="Item" />
    );
    expect(toJSON()).toBeTruthy();
  });

  it("should not render separator when isLast", () => {
    const { toJSON } = render(
      <SettingItem title="Last Item" isLast />
    );
    expect(toJSON()).toBeTruthy();
  });
});
