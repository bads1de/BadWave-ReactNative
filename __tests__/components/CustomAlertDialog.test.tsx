import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import CustomAlertDialog from "../../components/common/CustomAlertDialog";

describe("CustomAlertDialog", () => {
  // テスト用のプロップス
  const defaultProps = {
    visible: true,
    onConfirm: jest.fn(),
    onCancel: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ダイアログが表示される", () => {
    const { getByTestId, getByText } = render(
      <CustomAlertDialog {...defaultProps} />
    );

    // ダイアログが表示されていることを確認
    expect(getByTestId("alert-dialog-container")).toBeTruthy();

    // 確認メッセージが表示されていることを確認
    expect(getByText("本当にこのプレイリストを削除しますか？")).toBeTruthy();
  });

  it("ダイアログが非表示の場合は何も表示されない", () => {
    const { queryByTestId } = render(
      <CustomAlertDialog {...defaultProps} visible={false} />
    );

    // ダイアログが表示されていないことを確認
    expect(queryByTestId("alert-dialog-container")).toBeNull();
  });

  it("キャンセルボタンをクリックするとonCancelが呼ばれる", () => {
    const { getByTestId } = render(<CustomAlertDialog {...defaultProps} />);

    // キャンセルボタンをクリック
    fireEvent.press(getByTestId("cancel-button"));

    // onCancelが呼ばれることを確認
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });

  it("削除ボタンをクリックするとonConfirmが呼ばれる", () => {
    const { getByTestId } = render(<CustomAlertDialog {...defaultProps} />);

    // 削除ボタンをクリック
    fireEvent.press(getByTestId("confirm-button"));

    // onConfirmが呼ばれることを確認
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCancel).not.toHaveBeenCalled();
  });

  it("モーダルの背景をタップするとonCancelが呼ばれる", () => {
    const { getByTestId } = render(<CustomAlertDialog {...defaultProps} />);

    // モーダルの背景をタップ
    fireEvent(getByTestId("alert-dialog-container"), "requestClose");

    // onCancelが呼ばれることを確認
    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1);
  });
});
