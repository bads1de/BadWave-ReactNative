import React from "react";
import { render } from "@testing-library/react-native";
import Loading from "../../components/Loading";

describe("Loading", () => {
  it("デフォルトのサイズと色でローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading />);
    
    // ローディングコンテナが表示されていることを確認
    expect(getByTestId("loading-container")).toBeTruthy();
    
    // ActivityIndicatorが表示されていることを確認
    expect(getByTestId("loading-indicator")).toBeTruthy();
    
    // デフォルトの色が設定されていることを確認
    expect(getByTestId("loading-indicator").props.color).toBe("#4c1d95");
  });

  it("カスタムサイズでローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading size="large" />);
    
    // ローディングインジケータが表示されていることを確認
    expect(getByTestId("loading-indicator")).toBeTruthy();
    
    // サイズが設定されていることを確認
    expect(getByTestId("loading-indicator").props.size).toBe("large");
  });

  it("カスタム色でローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading color="#ff0000" />);
    
    // ローディングインジケータが表示されていることを確認
    expect(getByTestId("loading-indicator")).toBeTruthy();
    
    // 色が設定されていることを確認
    expect(getByTestId("loading-indicator").props.color).toBe("#ff0000");
  });

  it("数値サイズでローディングインジケータを表示する", () => {
    const { getByTestId } = render(<Loading size={40} />);
    
    // ローディングインジケータが表示されていることを確認
    expect(getByTestId("loading-indicator")).toBeTruthy();
    
    // サイズが設定されていることを確認
    expect(getByTestId("loading-indicator").props.size).toBe(40);
  });

  it("メモ化されたコンポーネントが正しくレンダリングされる", () => {
    const { rerender, getByTestId } = render(<Loading color="#4c1d95" />);
    
    // 初期の色が設定されていることを確認
    expect(getByTestId("loading-indicator").props.color).toBe("#4c1d95");
    
    // 異なる色で再レンダリング
    rerender(<Loading color="#ff0000" />);
    
    // 色が変更されていることを確認
    expect(getByTestId("loading-indicator").props.color).toBe("#ff0000");
  });
});
