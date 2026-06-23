/**
 * catchブロックのエラーから安全にメッセージを取得する
 * @param error - catchされたエラー
 * @param fallback - フォールバックメッセージ
 * @returns エラーメッセージ
 */
export function getErrorMessage(error: unknown, fallback = "Unknown error"): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error && typeof error.message === "string") {
    return error.message;
  }
  return fallback;
}

