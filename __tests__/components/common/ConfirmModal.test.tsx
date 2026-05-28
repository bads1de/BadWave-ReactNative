import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { ConfirmModal } from "@/components/common/ConfirmModal";

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, size, color }: any) => null,
}));

describe("ConfirmModal", () => {
  const defaultProps = {
    visible: true,
    title: "Test Title",
    description: "Test Description",
    confirmLabel: "Confirm",
    cancelLabel: "Cancel",
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render when visible", () => {
    const { getByText } = render(<ConfirmModal {...defaultProps} />);

    expect(getByText("Test Title")).toBeTruthy();
    expect(getByText("Test Description")).toBeTruthy();
    expect(getByText("Confirm")).toBeTruthy();
    expect(getByText("Cancel")).toBeTruthy();
  });

  it("should not render when not visible", () => {
    const { queryByText } = render(
      <ConfirmModal {...defaultProps} visible={false} />
    );

    expect(queryByText("Test Title")).toBeNull();
  });

  it("should call onConfirm when confirm button is pressed", () => {
    const { getByTestId } = render(<ConfirmModal {...defaultProps} />);

    fireEvent.press(getByTestId("modal-confirm-button"));

    expect(defaultProps.onConfirm).toHaveBeenCalled();
  });

  it("should call onCancel when cancel button is pressed", () => {
    const { getByText } = render(<ConfirmModal {...defaultProps} />);

    fireEvent.press(getByText("Cancel"));

    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it("should use default cancelLabel when not provided", () => {
    const { getByText } = render(
      <ConfirmModal {...defaultProps} cancelLabel={undefined} />
    );

    expect(getByText("Cancel")).toBeTruthy();
  });

  it("should render with custom icon", () => {
    const { getByText } = render(
      <ConfirmModal {...defaultProps} icon="trash" />
    );

    expect(getByText("Test Title")).toBeTruthy();
  });

  it("should render in non-destructive mode", () => {
    const { getByText } = render(
      <ConfirmModal {...defaultProps} isDestructive={false} />
    );

    expect(getByText("Test Title")).toBeTruthy();
  });
});
