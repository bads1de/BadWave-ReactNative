import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { BulkDownloadModal } from "@/components/download/BulkDownloadModal";

// Mock dependencies
jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

describe("BulkDownloadModal", () => {
  const progress = { current: 5, total: 10 };
  const onCancel = jest.fn();
  const onClose = jest.fn();

  it("renders correctly when downloading", () => {
    const { getByText, queryByText } = render(
      <BulkDownloadModal
        visible={true}
        progress={progress}
        isDownloading={true}
        mode="download"
        onCancel={onCancel}
        onClose={onClose}
      />,
    );

    expect(getByText("ダウンロード中...")).toBeTruthy();
    expect(getByText("5 / 10 曲")).toBeTruthy();
    expect(getByText("キャンセル")).toBeTruthy();
    expect(queryByText("閉じる")).toBeFalsy();
  });

  it("renders correctly when complete", () => {
    const completeProgress = { current: 10, total: 10 };
    const { getByText, queryByText } = render(
      <BulkDownloadModal
        visible={true}
        progress={completeProgress}
        isDownloading={false}
        mode="download"
        onCancel={onCancel}
        onClose={onClose}
      />,
    );

    expect(getByText("ダウンロード完了")).toBeTruthy();
    expect(getByText("10曲をダウンロードしました")).toBeTruthy();
    expect(getByText("閉じる")).toBeTruthy();
    expect(queryByText("キャンセル")).toBeFalsy();
  });

  it("renders correctly when there is an error", () => {
    const { getByText } = render(
      <BulkDownloadModal
        visible={true}
        progress={progress}
        isDownloading={false}
        mode="download"
        onCancel={onCancel}
        onClose={onClose}
        error="Something went wrong"
      />,
    );

    expect(getByText("エラー")).toBeTruthy();
    expect(getByText("Something went wrong")).toBeTruthy();
    expect(getByText("閉じる")).toBeTruthy();
  });

  it("calls onCancel when cancel button is pressed", () => {
    const { getByText } = render(
      <BulkDownloadModal
        visible={true}
        progress={progress}
        isDownloading={true}
        mode="download"
        onCancel={onCancel}
        onClose={onClose}
      />,
    );

    fireEvent.press(getByText("キャンセル"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("calls onClose when close button is pressed", () => {
    const { getByText } = render(
      <BulkDownloadModal
        visible={true}
        progress={{ current: 10, total: 10 }}
        isDownloading={false}
        mode="download"
        onCancel={onCancel}
        onClose={onClose}
      />,
    );

    fireEvent.press(getByText("閉じる"));
    expect(onClose).toHaveBeenCalled();
  });
});
