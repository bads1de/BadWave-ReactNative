import { withSupabaseRetry } from "@/lib/utils/retry";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * Supabase のクエリ結果の最小構造（data / error）。
 * PostgrestResponse / PostgrestSingleResponse はいずれもこの形に適合する。
 */
interface SupabaseResult<T> {
  data: T;
  error: { message: string } | null;
}

export interface RunQueryOptions<T> {
  /**
   * エラー時に throw せず返すフォールバック値。
   * 「取得失敗 = 空/未設定」を意味を持たせたい状態チェック用途でのみ指定する。
   * 省略時は throw する（デフォルトのポリシー）。
   */
  fallback?: T;

  /** ネットワークエラー時のリトライを行うか（デフォルト: true） */
  retry?: boolean;

  /** エラーメッセージの接頭辞（例: LIKE_ERRORS.SUPABASE_INSERT_FAILED） */
  errorPrefix?: string;
}

/**
 * Supabase クエリをリトライ付きで実行し、結果をアンラップする共通ヘルパー。
 *
 * actions / sync hooks で重複していた以下の処理を一元化する:
 * - `withSupabaseRetry` によるネットワークリトライ
 * - `error` を `getErrorMessage` でメッセージ化して `console.error` に記録し throw
 *
 * ポリシー: デフォルトは「ログして throw」。呼び出し元が失敗を「空/未設定」として
 * 扱う必要がある場合のみ `fallback` を指定して空返しにする。
 *
 * @param fn Supabase クエリを返す関数（呼び出しごとに評価される）
 * @param options リトライ・フォールバック・メッセージ接頭辞の設定
 * @returns 成功時の `data`
 * @throws エラー時に `getErrorMessage(error)` をメッセージとする Error
 */
export async function runQuery<T>(
  fn: () => PromiseLike<SupabaseResult<T>>,
  options: RunQueryOptions<T> = {},
): Promise<T> {
  const { fallback, retry = true, errorPrefix } = options;

  const toMessage = (error: unknown): string => {
    const message = getErrorMessage(error);
    return errorPrefix ? `${errorPrefix}: ${message}` : message;
  };

  const execute: () => Promise<SupabaseResult<T>> = retry
    ? () => withSupabaseRetry(async () => fn())
    : async () => fn();

  // ログ出力と throw / fallback を一元化する。
  // ここで throw した Error を再度 catch すると toMessage が二重適用されるため、
  // 呼び出し側では catch せずそのまま伝播させる。
  const handleError = (error: unknown): T => {
    const message = toMessage(error);
    console.error(message);

    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(message);
  };

  let result: SupabaseResult<T>;
  try {
    result = await execute();
  } catch (error) {
    return handleError(error);
  }

  if (result.error) {
    return handleError(result.error);
  }

  return result.data;
}

export default runQuery;
