import { getErrorMessage } from "@/lib/utils/error";

describe("getErrorMessage", () => {
  it("Errorインスタンスの場合、messageを返す", () => {
    const error = new Error("テストエラー");
    expect(getErrorMessage(error)).toBe("テストエラー");
  });

  it("Errorインスタンスでない場合、フォールバックを返す", () => {
    expect(getErrorMessage("文字列エラー")).toBe("Unknown error");
  });

  it("デフォルトのフォールバックを使用する", () => {
    expect(getErrorMessage(null)).toBe("Unknown error");
    expect(getErrorMessage(undefined)).toBe("Unknown error");
    expect(getErrorMessage(42)).toBe("Unknown error");
  });

  it("カスタムフォールバックを使用する", () => {
    expect(getErrorMessage("エラー", "カスタムフォールバック")).toBe("カスタムフォールバック");
  });

  it("Errorインスタンスで空のmessageの場合、空文字を返す", () => {
    const error = new Error("");
    expect(getErrorMessage(error)).toBe("");
  });

  it("Errorインスタンスでカスタムフォールバックが設定されている場合、messageを優先する", () => {
    const error = new Error("エラーメッセージ");
    expect(getErrorMessage(error, "フォールバック")).toBe("エラーメッセージ");
  });
});
