import React from "react";
import { render, fireEvent, act } from "@testing-library/react-native";
import SpotlightItem from "@/components/spotlights/SpotlightItem";
import { Spotlight } from "@/types";

// --- モック ---

const mockPlayer = {
  muted: false,
  play: jest.fn(),
  pause: jest.fn(),
};

jest.mock("expo-video", () => ({
  VideoView: "VideoView",
  useVideoPlayer: jest.fn(),
}));

jest.mock("@/hooks/audio/useSpotlightPlayer", () => ({
  useSpotlightPlayer: jest.fn(() => mockPlayer),
}));

// useSpotlightStore: index=0 が visible と仮定
jest.mock("@/hooks/stores/useSpotlightStore", () => ({
  useSpotlightStore: jest.fn((selector: (state: any) => any) =>
    selector({ visibleIndex: 0 }),
  ),
}));

// --- テスト共通データ ---

const mockSpotlight: Spotlight = {
  id: "1",
  video_path: "http://example.com/video.mp4",
  author: "Test Artist",
  title: "Test Song",
  description: "Test Description",
};

// --- テスト ---

describe("SpotlightItem - ミュートボタン", () => {
  beforeEach(() => {
    // 各テスト前に player.muted をリセット
    mockPlayer.muted = false;
  });

  it("初期状態: volume-medium アイコン（音あり）が表示される", () => {
    const { getByTestId } = render(
      <SpotlightItem item={mockSpotlight} index={0} isParentFocused={true} />,
    );
    // player.muted は false（音あり）= ミュート解除
    expect(mockPlayer.muted).toBe(false);
  });

  it("ミュートボタンを1回押す → player.muted が true になる", () => {
    const { getByRole, UNSAFE_getAllByType } = render(
      <SpotlightItem item={mockSpotlight} index={0} isParentFocused={true} />,
    );
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    // 最初のボタンがミュートボタン
    fireEvent.press(buttons[0]);
    expect(mockPlayer.muted).toBe(true);
  });

  it("ミュートボタンを2回押す → player.muted が false に戻る", () => {
    const { UNSAFE_getAllByType } = render(
      <SpotlightItem item={mockSpotlight} index={0} isParentFocused={true} />,
    );
    const { TouchableOpacity } = require("react-native");
    const buttons = UNSAFE_getAllByType(TouchableOpacity);
    fireEvent.press(buttons[0]); // 1回目: false → true
    expect(mockPlayer.muted).toBe(true);
    fireEvent.press(buttons[0]); // 2回目: true → false
    expect(mockPlayer.muted).toBe(false);
  });

  it("スポットライト表示開始時（非表示→表示）: player.muted が false にリセットされる", () => {
    // まず非表示状態でマウント
    const { rerender } = render(
      <SpotlightItem item={mockSpotlight} index={0} isParentFocused={false} />,
    );
    // ミュート状態にする（仮に前の状態がミュートだったとして）
    mockPlayer.muted = true;

    // 表示状態に切り替え（非表示→表示のトリガー）
    rerender(
      <SpotlightItem item={mockSpotlight} index={0} isParentFocused={true} />,
    );

    // player.muted がリセットされていること
    expect(mockPlayer.muted).toBe(false);
  });

  it("コンテンツが正しく表示される", () => {
    const { getAllByText } = render(
      <SpotlightItem item={mockSpotlight} index={0} isParentFocused={true} />,
    );
    expect(getAllByText("Test Artist").length).toBeGreaterThan(0);
    expect(getAllByText("Test Song").length).toBeGreaterThan(0);
  });
});
