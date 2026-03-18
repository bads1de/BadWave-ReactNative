import React from "react";
import { render } from "@testing-library/react-native";
import MarqueeText from "@/components/common/MarqueeText";

// モックの設定
jest.mock("@animatereactnative/marquee", () => ({
  Marquee: ({ children, speed, spacing, withGesture }: any) => {
    const View = require("react-native").View;
    return (
      <View testID="marquee-component" accessibilityLabel={`speed:${speed},spacing:${spacing},gesture:${withGesture}`}>
        {children}
      </View>
    );
  },
}));

describe("MarqueeText", () => {
  describe("レンダリングテスト", () => {
    it("コンポーネントが正しくレンダリングされる", () => {
      const { getByTestId } = render(<MarqueeText text="Test Text" />);
      
      expect(getByTestId("marquee-text-container")).toBeTruthy();
    });

    it("コンテナが正しいスタイルで表示される", () => {
      const { getByTestId } = render(<MarqueeText text="Test Text" />);
      
      const container = getByTestId("marquee-text-container");
      expect(container).toBeTruthy();
    });

    it("カスタムスタイルが適用される", () => {
      const customStyle = { backgroundColor: "red", height: 50 };
      const { getByTestId } = render(
        <MarqueeText text="Test Text" style={customStyle} />
      );
      
      const container = getByTestId("marquee-text-container");
      expect(container.props.style).toContainEqual(customStyle);
    });
  });

  describe("テキスト長に応じた動作", () => {
    it("短いテキスト（15文字以下）の場合、通常のTextコンポーネントが表示される", () => {
      const { getByText, queryByTestId } = render(
        <MarqueeText text="Short" />
      );
      
      expect(getByText("Short")).toBeTruthy();
      expect(queryByTestId("marquee-component")).toBeNull();
    });

    it("15文字のテキストの場合、通常のTextコンポーネントが表示される", () => {
      const text = "A".repeat(15);
      const { getByText, queryByTestId } = render(
        <MarqueeText text={text} />
      );
      
      expect(getByText(text)).toBeTruthy();
      expect(queryByTestId("marquee-component")).toBeNull();
    });

    it("長いテキスト（16文字以上）の場合、Marqueeコンポーネントが使用される", () => {
      const longText = "This is a very long text";
      const { getByTestId, getByText } = render(
        <MarqueeText text={longText} />
      );
      
      expect(getByTestId("marquee-component")).toBeTruthy();
      expect(getByText(longText)).toBeTruthy();
    });

    it("非常に長いテキストでもMarqueeが正しく表示される", () => {
      const veryLongText = "A".repeat(100);
      const { getByTestId, getByText } = render(
        <MarqueeText text={veryLongText} />
      );
      
      expect(getByTestId("marquee-component")).toBeTruthy();
      expect(getByText(veryLongText)).toBeTruthy();
    });

    it("animate=false の場合、長いテキストでも通常のTextが表示される", () => {
      const longText = "This is a very long text";
      const { getByText, queryByTestId } = render(
        <MarqueeText text={longText} animate={false} />
      );

      expect(getByText(longText)).toBeTruthy();
      expect(queryByTestId("marquee-component")).toBeNull();
    });
  });

  describe("データ表示", () => {
    it("テキストが正確に表示される", () => {
      const text = "Display This Text";
      const { getByText } = render(<MarqueeText text={text} />);
      
      expect(getByText(text)).toBeTruthy();
    });

    it("異なるテキストを正しく表示する", () => {
      const { rerender, getByText, queryByText } = render(
        <MarqueeText text="First Text" />
      );
      
      expect(getByText("First Text")).toBeTruthy();
      
      rerender(<MarqueeText text="Second Text That Is Long" />);
      
      expect(getByText("Second Text That Is Long")).toBeTruthy();
      expect(queryByText("First Text")).toBeNull();
    });

    it("テキストスタイルが正しく適用される", () => {
      const { getByText } = render(<MarqueeText text="Styled Text" />);
      
      const textElement = getByText("Styled Text");
      expect(textElement.props.style).toMatchObject(
        expect.arrayContaining([
          expect.objectContaining({
            color: "#fff",
            fontWeight: "bold",
          }),
        ])
      );
    });

    it("カスタムfontSizeが適用される", () => {
      const { getByText } = render(
        <MarqueeText text="Text" fontSize={20} />
      );
      
      const textElement = getByText("Text");
      expect(textElement.props.style).toContainEqual({ fontSize: 20 });
    });

    it("デフォルトのfontSizeが適用される", () => {
      const { getByText } = render(<MarqueeText text="Text" />);
      
      const textElement = getByText("Text");
      expect(textElement.props.style).toContainEqual({ fontSize: 16 });
    });
  });

  describe("Marqueeプロパティ", () => {
    it("デフォルトのspeedが適用される", () => {
      const { getByTestId } = render(
        <MarqueeText text="Long text for marquee" />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("speed:1");
    });

    it("カスタムspeedが適用される", () => {
      const { getByTestId } = render(
        <MarqueeText text="Long text for marquee" speed={2} />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("speed:2");
    });

    it("デフォルトのspacingが適用される", () => {
      const { getByTestId } = render(
        <MarqueeText text="Long text for marquee" />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("spacing:100");
    });

    it("カスタムspacingが適用される", () => {
      const { getByTestId } = render(
        <MarqueeText text="Long text for marquee" spacing={200} />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("spacing:200");
    });

    it("デフォルトのwithGestureが適用される", () => {
      const { getByTestId } = render(
        <MarqueeText text="Long text for marquee" />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("gesture:false");
    });

    it("withGesture=trueが適用される", () => {
      const { getByTestId } = render(
        <MarqueeText text="Long text for marquee" withGesture={true} />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("gesture:true");
    });

    it("すべてのカスタムプロパティが同時に適用される", () => {
      const { getByTestId, getByText } = render(
        <MarqueeText
          text="Long text for marquee"
          speed={3}
          spacing={150}
          withGesture={true}
          fontSize={18}
        />
      );
      
      const marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("speed:3");
      expect(marquee.props.accessibilityLabel).toContain("spacing:150");
      expect(marquee.props.accessibilityLabel).toContain("gesture:true");
      
      const textElement = getByText("Long text for marquee");
      expect(textElement.props.style).toContainEqual({ fontSize: 18 });
    });
  });

  describe("エッジケース", () => {
    it("空文字列でもエラーが発生しない", () => {
      expect(() => {
        render(<MarqueeText text="" />);
      }).not.toThrow();
    });

    it("空文字列の場合、通常のTextが表示される", () => {
      const { queryByTestId } = render(<MarqueeText text="" />);
      
      expect(queryByTestId("marquee-component")).toBeNull();
    });

    it("特殊文字を含むテキストが正しく表示される", () => {
      const specialText = "Special !@#$%^&*() Text";
      const { getByText } = render(<MarqueeText text={specialText} />);
      
      expect(getByText(specialText)).toBeTruthy();
    });

    it("日本語のテキストが正しく表示される", () => {
      const japaneseText = "これは日本語のテキストです";
      const { getByText } = render(<MarqueeText text={japaneseText} />);
      
      expect(getByText(japaneseText)).toBeTruthy();
    });

    it("絵文字を含むテキストが正しく表示される", () => {
      const emojiText = "Text with 🎵 emoji 🎶";
      const { getByText } = render(<MarqueeText text={emojiText} />);
      
      expect(getByText(emojiText)).toBeTruthy();
    });

    it("改行を含むテキストが正しく表示される", () => {
      const multilineText = "Line 1\nLine 2\nLine 3";
      const { getByText } = render(<MarqueeText text={multilineText} />);
      
      expect(getByText(multilineText)).toBeTruthy();
    });

    it("マルチバイト文字（15文字）の場合、通常のTextが表示される", () => {
      const text = "あいうえおかきくけこさしすせそ"; // 15文字
      const { queryByTestId, getByText } = render(
        <MarqueeText text={text} />
      );
      
      expect(getByText(text)).toBeTruthy();
      expect(queryByTestId("marquee-component")).toBeNull();
    });

    it("マルチバイト文字（16文字以上）の場合、Marqueeが使用される", () => {
      const text = "あいうえおかきくけこさしすせそた"; // 16文字
      const { getByTestId, getByText } = render(
        <MarqueeText text={text} />
      );
      
      expect(getByText(text)).toBeTruthy();
      expect(getByTestId("marquee-component")).toBeTruthy();
    });

    it("speed=0でもエラーが発生しない", () => {
      expect(() => {
        render(<MarqueeText text="Long text for marquee" speed={0} />);
      }).not.toThrow();
    });

    it("負のspeedでもエラーが発生しない", () => {
      expect(() => {
        render(<MarqueeText text="Long text for marquee" speed={-1} />);
      }).not.toThrow();
    });

    it("負のspacingでもエラーが発生しない", () => {
      expect(() => {
        render(<MarqueeText text="Long text for marquee" spacing={-50} />);
      }).not.toThrow();
    });
  });

  describe("メモ化", () => {
    it("同じpropsで再レンダリングしても不必要な再計算を行わない", () => {
      const text = "Long text for testing";
      const { rerender, getByText } = render(
        <MarqueeText text={text} speed={1} spacing={100} />
      );
      
      const firstRender = getByText(text);
      
      rerender(<MarqueeText text={text} speed={1} spacing={100} />);
      
      const secondRender = getByText(text);
      expect(secondRender).toBeTruthy();
    });

    it("textが変更された場合、正しく更新される", () => {
      const { rerender, getByText, queryByText } = render(
        <MarqueeText text="Original long text" />
      );
      
      expect(getByText("Original long text")).toBeTruthy();
      
      rerender(<MarqueeText text="Updated long text" />);
      
      expect(getByText("Updated long text")).toBeTruthy();
      expect(queryByText("Original long text")).toBeNull();
    });

    it("speedが変更された場合、正しく更新される", () => {
      const { rerender, getByTestId } = render(
        <MarqueeText text="Long text for marquee" speed={1} />
      );
      
      let marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("speed:1");
      
      rerender(<MarqueeText text="Long text for marquee" speed={2} />);
      
      marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("speed:2");
    });

    it("spacingが変更された場合、正しく更新される", () => {
      const { rerender, getByTestId } = render(
        <MarqueeText text="Long text for marquee" spacing={100} />
      );
      
      let marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("spacing:100");
      
      rerender(<MarqueeText text="Long text for marquee" spacing={200} />);
      
      marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("spacing:200");
    });

    it("withGestureが変更された場合、正しく更新される", () => {
      const { rerender, getByTestId } = render(
        <MarqueeText text="Long text for marquee" withGesture={false} />
      );
      
      let marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("gesture:false");
      
      rerender(<MarqueeText text="Long text for marquee" withGesture={true} />);
      
      marquee = getByTestId("marquee-component");
      expect(marquee.props.accessibilityLabel).toContain("gesture:true");
    });

    it("fontSizeが変更された場合、正しく更新される", () => {
      const { rerender, getByText } = render(
        <MarqueeText text="Text" fontSize={16} />
      );
      
      let textElement = getByText("Text");
      expect(textElement.props.style).toContainEqual({ fontSize: 16 });
      
      rerender(<MarqueeText text="Text" fontSize={20} />);
      
      textElement = getByText("Text");
      expect(textElement.props.style).toContainEqual({ fontSize: 20 });
    });

    it("styleが変更された場合、正しく更新される", () => {
      const style1 = { backgroundColor: "red" };
      const style2 = { backgroundColor: "blue" };
      
      const { rerender, getByTestId } = render(
        <MarqueeText text="Text" style={style1} />
      );
      
      let container = getByTestId("marquee-text-container");
      expect(container.props.style).toContainEqual(style1);
      
      rerender(<MarqueeText text="Text" style={style2} />);
      
      container = getByTestId("marquee-text-container");
      expect(container.props.style).toContainEqual(style2);
    });
  });

  describe("パフォーマンス", () => {
    it("複数のインスタンスを同時にレンダリングできる", () => {
      const { getByText } = render(
        <>
          <MarqueeText text="First Text" />
          <MarqueeText text="Second Long Text" />
          <MarqueeText text="Third Very Long Text For Testing" />
        </>
      );
      
      expect(getByText("First Text")).toBeTruthy();
      expect(getByText("Second Long Text")).toBeTruthy();
      expect(getByText("Third Very Long Text For Testing")).toBeTruthy();
    });

    it("大量のテキストでもパフォーマンスが維持される", () => {
      const largeText = "A".repeat(1000);
      
      expect(() => {
        render(<MarqueeText text={largeText} />);
      }).not.toThrow();
    });
  });

  describe("条件分岐ロジック", () => {
    it("境界値テスト: 14文字の場合、通常のTextが使用される", () => {
      const text = "A".repeat(14);
      const { queryByTestId } = render(<MarqueeText text={text} />);
      
      expect(queryByTestId("marquee-component")).toBeNull();
    });

    it("境界値テスト: 16文字の場合、Marqueeが使用される", () => {
      const text = "A".repeat(16);
      const { getByTestId } = render(<MarqueeText text={text} />);
      
      expect(getByTestId("marquee-component")).toBeTruthy();
    });

    it("テキスト長の判定が正確に行われる", () => {
      const shortText = "Short";
      const { rerender, queryByTestId } = render(
        <MarqueeText text={shortText} />
      );
      
      expect(queryByTestId("marquee-component")).toBeNull();
      
      const longText = "This is a very long text string";
      rerender(<MarqueeText text={longText} />);
      
      expect(queryByTestId("marquee-component")).toBeTruthy();
    });
  });
});

