import React from "react";
import { render } from "@testing-library/react-native";
import SpotlightModal from "@/components/modal/SpotlightModal";

jest.mock("expo-video", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    VideoView: (props) => React.createElement(View, { testID: "video-view", ...props }),
    useVideoPlayer: jest.fn(() => ({
      loop: true,
      play: jest.fn(),
      muted: false,
    })),
  };
});

jest.mock("react-native-reanimated", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      View: (props) => React.createElement(View, { testID: "animated-view", ...props }),
    },
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((toValue, config, callback) => {
      if (callback) callback(true);
      return toValue;
    }),
    interpolate: jest.fn(),
    Extrapolation: { CLAMP: "clamp" },
    runOnJS: jest.fn((fn) => fn),
  };
});

describe("SpotlightModal", () => {
  const mockItem = {
    id: "1",
    title: "Test Spotlight",
    video_path: "https://example.com/video.mp4",
  };

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(
      <SpotlightModal
        visible={false}
        item={mockItem}
        isMuted={false}
        onMuteToggle={jest.fn()}
        onClose={jest.fn()}
      />
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
