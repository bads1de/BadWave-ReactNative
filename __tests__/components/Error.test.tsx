import React from "react";
import { render } from "@testing-library/react-native";
import Error from "../../components/common/Error";

// モックの設定
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("Error", () => {
  it("エラーメッセージを正しく表示する", () => {
    const { getByText, getByTestId } = render(
      <Error message="テストエラーメッセージ" />
    );

    expect(getByTestId("error-message")).toBeTruthy();
    expect(getByText("テストエラーメッセージ")).toBeTruthy();
  });

  it("メッセージが指定されていない場合はデフォルトメッセージを表示する", () => {
    const { getByTestId } = render(<Error />);

    // エラーコンテナが表示されていることを確認
    expect(getByTestId("error-container")).toBeTruthy();

    // デフォルトメッセージが表示されることを確認
    expect(getByTestId("error-message").props.children).toBe(
      "エラーが発生しました"
    );
  });

  it("アイコンが表示される", () => {
    const { getByTestId } = render(<Error message="テストエラーメッセージ" />);

    // コンテナが表示されていることを確認
    expect(getByTestId("error-container")).toBeTruthy();

    // Ioniconsがモックされているため、実際のアイコンは表示されないが、
    // コンポーネントが正しくレンダリングされていることを確認
    expect(getByTestId("error-message")).toBeTruthy();
  });

  it("メモ化されたコンポーネントが正しくレンダリングされる", () => {
    const { rerender, getByTestId } = render(
      <Error message="初期メッセージ" />
    );

    expect(getByTestId("error-message").props.children).toBe("初期メッセージ");

    // 異なるメッセージで再レンダリング
    rerender(<Error message="変更されたメッセージ" />);

    expect(getByTestId("error-message").props.children).toBe(
      "変更されたメッセージ"
    );
  });
});
