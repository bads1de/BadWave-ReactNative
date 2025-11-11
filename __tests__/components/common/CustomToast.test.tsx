import React from "react";
import { render } from "@testing-library/react-native";
import { ToastComponent } from "@/components/common/CustomToast";

jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: "Toast",
  BaseToastProps: {},
}));

jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("@/constants/theme", () => ({
  COLORS: {
    text: "#ffffff",
  },
  GRADIENTS: {
    success: ["#00ff00", "#00aa00"],
    error: ["#ff0000", "#aa0000"],
  },
}));

describe("CustomToast", () => {
  it("renders Toast component", () => {
    const { UNSAFE_getByType } = render(<ToastComponent />);

    expect(UNSAFE_getByType("Toast")).toBeTruthy();
  });

  it("component is memoized", () => {
    const { rerender, UNSAFE_getByType } = render(<ToastComponent />);
    const firstRender = UNSAFE_getByType("Toast");

    rerender(<ToastComponent />);
    const secondRender = UNSAFE_getByType("Toast");

    // メモ化されているため、同じインスタンスが使用される
    expect(firstRender).toBe(secondRender);
  });
});
