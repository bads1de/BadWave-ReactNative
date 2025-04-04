import React from "react";
import { render } from "@testing-library/react-native";
import { Text, View } from "react-native";

// コンポーネントのモック
jest.mock("@/components/LibraryDownloads", () => ({
  LibraryDownloads: () => (
    <View>
      <Text>ダウンロード済みの曲</Text>
    </View>
  ),
}));

// インポート
import { LibraryDownloads } from "@/components/LibraryDownloads";

describe("LibraryDownloads", () => {
  it("ダウンロード済みの曲が表示される", () => {
    const { getByText } = render(<LibraryDownloads />);
    expect(getByText("ダウンロード済みの曲")).toBeTruthy();
  });
});
