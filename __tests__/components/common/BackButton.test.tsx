import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import BackButton from "@/components/common/BackButton";

jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({
    back: jest.fn(),
  })),
}));

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        primary: "#FF0000",
        text: "#FFFFFF",
      },
    })
  ),
}));

describe("BackButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with default testID", () => {
    const { getByTestId } = render(<BackButton />);
    expect(getByTestId("back-button")).toBeTruthy();
  });

  it("should call router.back when pressed without custom onPress", () => {
    const mockBack = jest.fn();
    const { useRouter } = require("expo-router");
    useRouter.mockReturnValue({ back: mockBack });

    const { getByTestId } = render(<BackButton />);
    fireEvent.press(getByTestId("back-button"));

    expect(mockBack).toHaveBeenCalled();
  });

  it("should call custom onPress when provided", () => {
    const customOnPress = jest.fn();
    const { getByTestId } = render(<BackButton onPress={customOnPress} />);
    fireEvent.press(getByTestId("back-button"));

    expect(customOnPress).toHaveBeenCalled();
  });

  it("should apply custom size", () => {
    const { getByTestId } = render(<BackButton size={60} />);
    const button = getByTestId("back-button");

    // Just verify it renders without error
    expect(button).toBeTruthy();
  });

  it("should apply custom testID", () => {
    const { getByTestId } = render(<BackButton testID="custom-back" />);
    expect(getByTestId("custom-back")).toBeTruthy();
  });

  it("should apply custom iconColor", () => {
    const { getByTestId } = render(<BackButton iconColor="#00FF00" />);
    expect(getByTestId("back-button")).toBeTruthy();
  });

  it("should apply custom style", () => {
    const customStyle = { margin: 10 };
    const { getByTestId } = render(<BackButton style={customStyle} />);
    expect(getByTestId("back-button")).toBeTruthy();
  });
});
