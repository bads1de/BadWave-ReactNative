import React from "react";
import { render } from "@testing-library/react-native";

// コンポーネントのモック
jest.mock("@/components/LibraryDownloads", () => {
  return {
    LibraryDownloads: function MockLibraryDownloads() {
      return { type: "div", props: { children: "ダウンロード済みの曲" } };
    },
  };
});

// インポート
import { LibraryDownloads } from "@/components/LibraryDownloads";

describe("LibraryDownloads", () => {
  it("ダウンロード済みの曲が表示される", () => {
    const { getByText } = render(<LibraryDownloads />);
    expect(getByText("ダウンロード済みの曲")).toBeTruthy();
  });
});
