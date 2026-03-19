import React from "react";
import { render } from "@testing-library/react-native";
import HeroBoard from "@/components/board/HeroBoard";

jest.mock("expo-image", () => ({ ImageBackground: "ImageBackground" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(),
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
}));

// Mock for react-native-reanimated with callback support
jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View, Text, ScrollView } = require("react-native");

  return {
    __esModule: true,
    default: {
      View: View,
      Text: Text,
      ScrollView: ScrollView,
      createAnimatedComponent: jest.fn((component) => component),
    },
    createAnimatedComponent: jest.fn((component) => component),
    useSharedValue: jest.fn((initialValue) => {
      const ref = { value: initialValue };
      return ref;
    }),
    useAnimatedScrollHandler: jest.fn(() => ({})),
    useAnimatedStyle: jest.fn((callback) => {
      // Execute the callback to get styles
      try {
        return callback() || {};
      } catch {
        return {};
      }
    }),
    withTiming: jest.fn((value, config, callback) => {
      // Execute callback synchronously so test passes
      if (callback) {
        callback(true);
      }
      return value;
    }),
    withSpring: jest.fn((value) => value),
    runOnJS: jest.fn((fn) => {
      return () => fn();
    }),
    Easing: {
      ease: jest.fn(),
      bezier: jest.fn(),
      inOut: jest.fn(),
      out: jest.fn(),
      in: jest.fn(),
    },
  };
});

jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("@/constants", () => ({
  genreCards: [
    { name: "Retro Wave", emoji: "🌆" },
    { name: "Electro House", emoji: "⚡" },
    { name: "Nu Disco", emoji: "💿" },
  ],
}));

const { useRouter } = require("expo-router");

describe("HeroBoard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ push: jest.fn() });
  });

  it("renders without crashing", () => {
    const { getByText } = render(<HeroBoard />);
    expect(getByText("Electro House")).toBeTruthy();
    expect(getByText("DISCOVER")).toBeTruthy();
  });
});
