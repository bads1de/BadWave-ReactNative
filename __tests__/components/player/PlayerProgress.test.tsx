import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import PlayerProgress from "@/components/player/PlayerProgress";
import { useProgress } from "react-native-track-player";

// Mock dependencies
jest.mock("react-native-track-player", () => ({
  useProgress: jest.fn(),
}));

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) => {
    const mockColors = {
      primary: "#FF0000",
      subText: "#888888",
    };
    if (typeof selector === "function") {
      return selector({ colors: mockColors });
    }
    return { colors: mockColors };
  }),
}));

// mockSlider
jest.mock("@react-native-community/slider", () => {
  const React = require("react");
  const { View } = require("react-native");
  return (props: any) => React.createElement(View, props);
});

describe("PlayerProgress", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with current position and duration", () => {
    (useProgress as jest.Mock).mockReturnValue({
      position: 60, // 1 minute
      duration: 180, // 3 minutes
    });

    const onSeek = jest.fn();
    const { getByText, getByTestId } = render(
      <PlayerProgress onSeek={onSeek} />,
    );

    // formatTime(60 * 1000) should be "01:00" or similar
    // formatTime(180 * 1000) should be "03:00"
    expect(getByText(/1:00|01:00/)).toBeTruthy();
    expect(getByText(/3:00|03:00/)).toBeTruthy();

    const slider = getByTestId("seek-slider");
    expect(slider.props.value).toBe(60000);
    expect(slider.props.maximumValue).toBe(180000);
  });

  it("calls onSeek when slider value changes", () => {
    (useProgress as jest.Mock).mockReturnValue({
      position: 0,
      duration: 100,
    });

    const onSeek = jest.fn();
    const { getByTestId } = render(<PlayerProgress onSeek={onSeek} />);

    const slider = getByTestId("seek-slider");

    // Simulate slider complete
    fireEvent(slider, "onSlidingComplete", 50000);

    expect(onSeek).toHaveBeenCalledWith(50000);
  });
});
