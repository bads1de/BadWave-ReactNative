import React from "react";
import { render } from "@testing-library/react-native";
import MarqueeText from "../MarqueeText";

// モックの作成
jest.mock("@animatereactnative/marquee", () => {
  return {
    Marquee: ({ children, ...props }: any) => {
      return (
        <mock-marquee {...props} testID="mock-marquee">
          {children}
        </mock-marquee>
      );
    },
  };
});

describe("MarqueeText", () => {
  it("renders correctly", () => {
    const { getByTestId } = render(<MarqueeText text="Test Text" />);
    expect(getByTestId("marquee-text-container")).toBeTruthy();
  });

  it("passes text to Marquee component", () => {
    const testText = "Test Marquee Text";
    const { getByText } = render(<MarqueeText text={testText} />);
    expect(getByText(testText)).toBeTruthy();
  });

  it("applies custom styles when provided", () => {
    const customStyle = { backgroundColor: "red" };
    const { getByTestId } = render(
      <MarqueeText text="Test" style={customStyle} />
    );
    const container = getByTestId("marquee-text-container");
    // スタイルは配列として適用されるため、配列内に期待するスタイルが含まれているかチェック
    expect(container.props.style[1]).toEqual(customStyle);
  });

  it("passes speed prop to Marquee component", () => {
    const { getByTestId } = render(<MarqueeText text="Test" speed={2} />);
    const marquee = getByTestId("mock-marquee");
    expect(marquee.props.speed).toBe(2);
  });

  it("passes spacing prop to Marquee component", () => {
    const { getByTestId } = render(<MarqueeText text="Test" spacing={30} />);
    const marquee = getByTestId("mock-marquee");
    expect(marquee.props.spacing).toBe(30);
  });
});
