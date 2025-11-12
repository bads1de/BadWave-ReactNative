import React from "react";
import { render } from "@testing-library/react-native";
import HeroBoard from "@/components/board/HeroBoard";

jest.mock("expo-image", () => ({ ImageBackground: "ImageBackground" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  
  return {
    __esModule: true,
    default: {
      View: View,
      Text: require("react-native").Text,
      ScrollView: require("react-native").ScrollView,
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((value) => value),
    withSpring: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => fn),
    Easing: {
      ease: jest.fn(),
      bezier: jest.fn(),
    },
  };
});
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("@/constants", () => ({
  genreCards: [
    { genre: "Retro Wave", emoji: "🌆" },
    { genre: "Electro House", emoji: "⚡" },
  ],
}));

const { useRouter } = require("expo-router");

describe("HeroBoard", () => {
  beforeEach(() => {
    useRouter.mockReturnValue({ push: jest.fn() });
  });

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<HeroBoard />);
    expect(UNSAFE_root).toBeTruthy();
  });
});
