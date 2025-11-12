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
    const { getByTestId } = render(<ListItemOptionsMenu />);

    expect(getByTestId("menu-button")).toBeTruthy();
  });

  it("opens modal when menu button is pressed", () => {
    const { getByTestId, getByText } = render(
      <ListItemOptionsMenu onDelete={jest.fn()} />
    );

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(getByText("削除")).toBeTruthy();
  });

  it("calls onDelete when delete option is pressed", () => {
    const mockOnDelete = jest.fn();
    const { getByTestId } = render(
      <ListItemOptionsMenu onDelete={mockOnDelete} />
    );

    // メニューボタンを押してモーダルを開く
    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    // 削除ボタンを押す
    const deleteButton = getByTestId("delete-option");
    fireEvent.press(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledTimes(1);
  });

  it("does not show delete option when onDelete is not provided", () => {
    const { getByTestId, queryByText } = render(<ListItemOptionsMenu />);

    const menuButton = getByTestId("menu-button");
    fireEvent.press(menuButton);

    expect(queryByText("削除")).toBeNull();
  });
});
