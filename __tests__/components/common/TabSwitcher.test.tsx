import React from "react";
import { render } from "@testing-library/react-native";
import { TabSwitcher } from "@/components/common/TabSwitcher";

// Need to import fireEvent
import { fireEvent } from "@testing-library/react-native";

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        primary: "#FF0000",
        text: "#FFFFFF",
        subText: "#888888",
        background: "#000000",
      },
    })
  ),
}));

describe("TabSwitcher", () => {
  const options = [
    { label: "Songs", value: "songs" },
    { label: "Playlists", value: "playlists" },
  ];

  it("should render all tab options", () => {
    const { getByText } = render(
      <TabSwitcher options={options} value="songs" onValueChange={jest.fn()} />
    );

    expect(getByText("Songs")).toBeTruthy();
    expect(getByText("Playlists")).toBeTruthy();
  });

  it("should call onValueChange when tab is pressed", () => {
    const onValueChange = jest.fn();
    const { getByText } = render(
      <TabSwitcher options={options} value="songs" onValueChange={onValueChange} />
    );

    fireEvent.press(getByText("Playlists"));

    expect(onValueChange).toHaveBeenCalledWith("playlists");
  });

  it("should render with icon", () => {
    const MockIcon = () => null;
    const optionsWithIcon = [
      { label: "Songs", value: "songs", icon: MockIcon },
      { label: "Playlists", value: "playlists", icon: MockIcon },
    ];

    const { getByText } = render(
      <TabSwitcher
        options={optionsWithIcon}
        value="songs"
        onValueChange={jest.fn()}
      />
    );

    expect(getByText("Songs")).toBeTruthy();
  });

  it("should apply containerStyle", () => {
    const { getByText } = render(
      <TabSwitcher
        options={options}
        value="songs"
        onValueChange={jest.fn()}
        containerStyle={{ marginTop: 20 }}
      />
    );

    expect(getByText("Songs")).toBeTruthy();
  });
});
