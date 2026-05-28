import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { LibraryAuthPrompt } from "@/components/library/LibraryAuthPrompt";

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        primary: "#FF0000",
        background: "#000000",
        subText: "#888888",
      },
    })
  ),
}));

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});

jest.mock("@/components/common/CustomButton", () => {
  const { TouchableOpacity, Text } = require("react-native");
  return {
    __esModule: true,
    default: ({ label, onPress }: any) => (
      <TouchableOpacity testID="sign-in-button" onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});

describe("LibraryAuthPrompt", () => {
  it("should render sign in message", () => {
    const { getByText } = render(<LibraryAuthPrompt onSignIn={jest.fn()} />);

    expect(
      getByText(
        "Unlock your musical sanctuary. Sign in to access your personal collection."
      )
    ).toBeTruthy();
  });

  it("should render sign in button", () => {
    const { getByTestId } = render(<LibraryAuthPrompt onSignIn={jest.fn()} />);

    expect(getByTestId("sign-in-button")).toBeTruthy();
  });

  it("should call onSignIn when button is pressed", () => {
    const onSignIn = jest.fn();
    const { getByTestId } = render(<LibraryAuthPrompt onSignIn={onSignIn} />);

    fireEvent.press(getByTestId("sign-in-button"));
    expect(onSignIn).toHaveBeenCalled();
  });
});
