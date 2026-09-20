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

  it("Errorインスタンスで空のmessageの場合、フォールバックを返す", () => {
    expect(getErrorMessage(new Error(""))).toBe("Unknown error");
  });

  it("messageが数値のオブジェクトの場合、文字列に変換して返す", () => {
    expect(getErrorMessage({ message: 500 })).toBe("500");
  });

  it("messageが空文字・空白のみの場合はフォールバックを返す", () => {
    expect(getErrorMessage({ message: "" })).toBe("Unknown error");
    expect(getErrorMessage({ message: "   " })).toBe("Unknown error");
  });

  it("messageが文字列・数値以外のオブジェクトの場合はフォールバックを返す", () => {
    expect(getErrorMessage({ message: null })).toBe("Unknown error");
    expect(getErrorMessage({ message: undefined })).toBe("Unknown error");
    expect(getErrorMessage({ message: true })).toBe("Unknown error");
    expect(getErrorMessage({ message: { nested: 1 } })).toBe("Unknown error");
  });

  it("Errorインスタンスでカスタムフォールバックが設定されている場合、messageを優先する", () => {
    const error = new Error("エラーメッセージ");
    expect(getErrorMessage(error, "フォールバック")).toBe("エラーメッセージ");
  });
});
