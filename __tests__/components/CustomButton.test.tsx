import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CustomButton from "../../components/common/CustomButton";

describe("CustomButton", () => {
  // テスト用のスタイル
  const activeStyle = { backgroundColor: "#4c1d95" };
  const inactiveStyle = { backgroundColor: "#333" };
  const activeTextStyle = { color: "#fff" };
  const inactiveTextStyle = { color: "#999" };

  // テスト用のプロップス
  const defaultProps = {
    label: "テストボタン",
    isActive: true,
    activeStyle,
    inactiveStyle,
    activeTextStyle,
    inactiveTextStyle,
    onPress: jest.fn(),
    testID: "custom-button",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("アクティブ状態で正しくレンダリングされる", () => {
    const { getByText, getByTestId } = render(
      <CustomButton {...defaultProps} />
    );

    // ラベルが正しく表示される
    expect(getByText("テストボタン")).toBeTruthy();

    // アクティブスタイルが適用されている
    const button = getByTestId("custom-button");
    expect(button.props.style).toMatchObject({
      backgroundColor: "#4c1d95",
    });
  });

  it("非アクティブ状態で正しくレンダリングされる", () => {
    const { getByText, getByTestId } = render(
      <CustomButton {...defaultProps} isActive={false} />
    );

    // ラベルが正しく表示される
    expect(getByText("テストボタン")).toBeTruthy();

    // 非アクティブスタイルが適用されている
    const button = getByTestId("custom-button");
    expect(button.props.style).toMatchObject({
      backgroundColor: "#333",
    });
  });

  it("ボタンをタップするとonPressが呼ばれる", () => {
    const { getByTestId } = render(<CustomButton {...defaultProps} />);

    // ボタンをタップ
    fireEvent.press(getByTestId("custom-button"));

    // onPressが呼ばれる
    expect(defaultProps.onPress).toHaveBeenCalledTimes(1);
  });

  it("カスタムスタイルが適用されない場合はデフォルトスタイルが使用される", () => {
    const { getByTestId } = render(
      <CustomButton
        label="テストボタン"
        isActive={true}
        onPress={jest.fn()}
        testID="custom-button"
      />
    );

    // デフォルトスタイルが適用されている
    const button = getByTestId("custom-button");
    expect(button.props.style).toMatchObject({
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 24,
    });
  });

  it("メモ化の条件をテストする", () => {
    // CustomButtonのメモ化の条件は、labelとisActiveが同じ場合は再レンダリングしない
    const { rerender, getByTestId, getByText } = render(
      <CustomButton {...defaultProps} />
    );

    // 同じpropsで再レンダリング
    rerender(<CustomButton {...defaultProps} />);

    // onPressが呼ばれていないことを確認
    expect(defaultProps.onPress).not.toHaveBeenCalled();

    // 異なるpropsで再レンダリング
    rerender(<CustomButton {...defaultProps} label="変更されたラベル" />);

    // ラベルが変更されていることを確認
    expect(getByTestId("custom-button")).toBeTruthy();
    expect(getByText("変更されたラベル")).toBeTruthy();
  });
});

