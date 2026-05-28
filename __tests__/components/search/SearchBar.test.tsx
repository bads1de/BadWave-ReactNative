import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SearchBar } from "@/components/search/SearchBar";

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

jest.mock("@/hooks/common/useDebounce", () => ({
  useDebounce: (value: any) => value,
}));

describe("SearchBar", () => {
  const defaultProps = {
    onDebouncedChange: jest.fn(),
    onInputChange: jest.fn(),
    onSubmit: jest.fn(),
    onFocus: jest.fn(),
    onBlur: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with placeholder", () => {
    const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);

    expect(getByPlaceholderText("Search songs or playlists...")).toBeTruthy();
  });

  it("should call onInputChange when text is entered", () => {
    const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
    const input = getByPlaceholderText("Search songs or playlists...");

    fireEvent.changeText(input, "test query");

    expect(defaultProps.onInputChange).toHaveBeenCalledWith("test query");
  });

  it("should call onSubmit when submitting", () => {
    const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
    const input = getByPlaceholderText("Search songs or playlists...");

    fireEvent.changeText(input, "test");
    fireEvent(input, "submitEditing");

    expect(defaultProps.onSubmit).toHaveBeenCalled();
  });

  it("should call onFocus when input is focused", () => {
    const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
    const input = getByPlaceholderText("Search songs or playlists...");

    fireEvent(input, "focus");

    expect(defaultProps.onFocus).toHaveBeenCalled();
  });

  it("should call onBlur when input is blurred", () => {
    const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
    const input = getByPlaceholderText("Search songs or playlists...");

    fireEvent(input, "blur");

    expect(defaultProps.onBlur).toHaveBeenCalled();
  });

  it("should show clear button when value is not empty", () => {
    const { getByPlaceholderText, getByRole } = render(
      <SearchBar {...defaultProps} />
    );
    const input = getByPlaceholderText("Search songs or playlists...");

    fireEvent.changeText(input, "test");

    // Clear button should be visible (CircleX icon)
    expect(input.props.value).toBe("test");
  });

  it("should clear value when clear button is pressed", () => {
    const { getByPlaceholderText } = render(<SearchBar {...defaultProps} />);
    const input = getByPlaceholderText("Search songs or playlists...");

    fireEvent.changeText(input, "test");
    fireEvent.changeText(input, "");

    expect(defaultProps.onInputChange).toHaveBeenCalledWith("");
    expect(defaultProps.onDebouncedChange).toHaveBeenCalledWith("");
  });

  it("should update value when controlledValue changes", () => {
    const { rerender, getByPlaceholderText } = render(
      <SearchBar {...defaultProps} controlledValue="initial" />
    );

    const input = getByPlaceholderText("Search songs or playlists...");
    expect(input.props.value).toBe("initial");

    rerender(<SearchBar {...defaultProps} controlledValue="updated" />);

    const updatedInput = getByPlaceholderText("Search songs or playlists...");
    expect(updatedInput.props.value).toBe("updated");
  });
});
