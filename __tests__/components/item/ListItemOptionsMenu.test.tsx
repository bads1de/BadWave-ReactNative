import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import ListItemOptionsMenu from "@/components/item/ListItemOptionsMenu";

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

describe("ListItemOptionsMenu", () => {
  it("renders menu button", () => {
    const { UNSAFE_getAllByType } = render(<ListItemOptionsMenu />);

    const touchables = UNSAFE_getAllByType("TouchableOpacity");
    expect(touchables.length).toBeGreaterThan(0);
  });

  it("opens modal when menu button is pressed", () => {
    const { UNSAFE_getAllByType, getByText } = render(
      <ListItemOptionsMenu onDelete={jest.fn()} />
    );

    const touchables = UNSAFE_getAllByType("TouchableOpacity");
    const menuButton = touchables[0];
    fireEvent.press(menuButton);

    expect(getByText("削除")).toBeTruthy();
  });

  it("calls onDelete when delete option is pressed", () => {
    const mockOnDelete = jest.fn();
    const { UNSAFE_getAllByType, getByText } = render(
      <ListItemOptionsMenu onDelete={mockOnDelete} />
    );

    // メニューボタンを押してモーダルを開く
    const touchables = UNSAFE_getAllByType("TouchableOpacity");
    const menuButton = touchables[0];
    fireEvent.press(menuButton);

    // 削除ボタンを押す
    const deleteButton = getByText("削除");
    fireEvent.press(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("does not show delete option when onDelete is not provided", () => {
    const { UNSAFE_getAllByType, queryByText } = render(<ListItemOptionsMenu />);

    const touchables = UNSAFE_getAllByType("TouchableOpacity");
    const menuButton = touchables[0];
    fireEvent.press(menuButton);

    expect(queryByText("削除")).toBeNull();
  });
});
