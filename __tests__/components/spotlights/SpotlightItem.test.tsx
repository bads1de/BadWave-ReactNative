import React from "react";
import { render } from "@testing-library/react-native";
import SpotlightItem from "@/components/spotlights/SpotlightItem";
import { Spotlight } from "@/types";

// Mock expo-video
jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(),
}));

// Mock useSpotlightPlayer
jest.mock("@/hooks/useSpotlightPlayer", () => ({
  useSpotlightPlayer: jest.fn(),
}));

describe("SpotlightItem", () => {
  const mockSpotlight: Spotlight = {
    id: "1",
    video_path: "http://example.com/video.mp4",
    author: "Test Artist",
    title: "Test Song",
    description: "Test Description",
  };

  it("renders correctly", () => {
    const { getByText } = render(
      <SpotlightItem item={mockSpotlight} isVisible={true} />
    );

    expect(getByText("Test Artist")).toBeTruthy();
    expect(getByText("Test Song")).toBeTruthy();
  });
});
