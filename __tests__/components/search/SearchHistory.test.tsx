import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { SearchHistory } from "@/components/search/SearchHistory";

describe("SearchHistory", () => {
  const mockOnSelect = jest.fn();
  const mockOnRemove = jest.fn();
  const mockOnClearAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================
  // 表示
  // ============================
  describe("表示", () => {
    it("履歴が空の場合は何も表示しない", () => {
      const { queryByTestId } = render(
        <SearchHistory
          history={[]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      expect(queryByTestId("search-history-container")).toBeNull();
    });

    it("履歴がある場合はコンテナが表示される", () => {
      const { getByTestId } = render(
        <SearchHistory
          history={["query1", "query2"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      expect(getByTestId("search-history-container")).toBeTruthy();
    });

    it("セクションタイトル「Recent Searches」が表示される", () => {
      const { getByText } = render(
        <SearchHistory
          history={["query1"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      expect(getByText("Recent Searches")).toBeTruthy();
    });

    it("各履歴キーワードがチップとして表示される", () => {
      const { getByText } = render(
        <SearchHistory
          history={["react native", "expo router"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      expect(getByText("react native")).toBeTruthy();
      expect(getByText("expo router")).toBeTruthy();
    });

    it("Clear Allボタンが表示される", () => {
      const { getByTestId } = render(
        <SearchHistory
          history={["query1"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      expect(getByTestId("clear-all-button")).toBeTruthy();
    });
  });

  // ============================
  // インタラクション
  // ============================
  describe("インタラクション", () => {
    it("履歴チップをタップするとonSelectが呼ばれる", () => {
      const { getByText } = render(
        <SearchHistory
          history={["test query"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      fireEvent.press(getByText("test query"));
      expect(mockOnSelect).toHaveBeenCalledWith("test query");
    });

    it("削除ボタンをタップするとonRemoveが呼ばれる", () => {
      const { getByTestId } = render(
        <SearchHistory
          history={["remove me"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      fireEvent.press(getByTestId("remove-history-remove me"));
      expect(mockOnRemove).toHaveBeenCalledWith("remove me");
    });

    it("Clear AllボタンをタップするとonClearAllが呼ばれる", () => {
      const { getByTestId } = render(
        <SearchHistory
          history={["query1"]}
          onSelect={mockOnSelect}
          onRemove={mockOnRemove}
          onClearAll={mockOnClearAll}
        />,
      );

      fireEvent.press(getByTestId("clear-all-button"));
      expect(mockOnClearAll).toHaveBeenCalled();
    });
  });
});
