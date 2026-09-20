import { NETWORK_ERRORS } from "@/constants/errorMessages";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * バックオフ戦略の種類
 */
export type BackoffStrategy = "linear" | "exponential";

/**
 * リトライ設定のインターフェース
 */
export interface RetryConfig {
  /**
   * 最大リトライ回数（デフォルト: 3）
   */
  maxRetries?: number;

  /**
   * 初期遅延時間（ミリ秒、デフォルト: 1000）
   */
  delay?: number;

  /**
   * バックオフ戦略（デフォルト: "exponential"）
   * - linear: 遅延時間が一定
   * - exponential: 遅延時間が指数関数的に増加
   */
  backoff?: BackoffStrategy;

  /**
   * リトライすべきかを判定するカスタム関数
   * trueを返すとリトライ、falseを返すとエラーをスロー
   */
  shouldRetry?: (error: Error) => boolean;

  /**
   * リトライ時に呼ばれるコールバック
   * @param error 発生したエラー
   * @param attempt 現在のリトライ回数
   * @param maxRetries 最大リトライ回数
   */
  onRetry?: (error: Error, attempt: number, maxRetries: number) => void;
}

/**
 * リクエストがサーバーに到達しなかった（＝再送しても安全な）接続レベルの失敗パターン。
 * supabase-js は通信失敗を throw せず `{ error: { message } }` として返すため、
 * その message を小文字化してここで判定する。
 */
const CONNECTION_ERROR_PATTERNS = [
  "network", // "Network request failed" など
  "fetch failed",
  "failed to fetch",
  "load failed", // Safari
  "econnrefused",
  "econnreset",
  "enotfound",
  "eai_again",
  "err_network",
  "err_internet_disconnected",
] as const;

/**
 * リクエストがサーバーに到達していない（再送しても安全な）接続レベルの失敗かどうか
 *
 * タイムアウトはサーバーが処理済みの可能性があり「未達」と言い切れないため、
 * 書き込みの再送で二重登録になり得る。ここでは含めない。
 */
const isConnectionError = (error: Error): boolean => {
  const message = error.message.toLowerCase();
  return CONNECTION_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
};

/**
 * デフォルトのリトライ判定関数
 * ネットワークエラーや一時的なエラーの場合にリトライする
 *
 * タイムアウトや 5xx も対象に含むため、書き込みには使わないこと
 * （supabase-js 経由の書き込みは `withSupabaseRetry` が厳しい判定を使う）。
 */
const defaultShouldRetry = (error: Error): boolean => {
  const message = error.message.toLowerCase();

  // 接続レベルの失敗（リクエストが届いていない）はリトライ
  if (isConnectionError(error)) {
    return true;
  }

  // タイムアウトは一時的な失敗の可能性が高いためリトライ
  if (message.includes("timeout") || message.includes("etimedout")) {
    return true;
  }

  // 一時的なサーバーエラー（5xx）はリトライ
  if (message.includes("500") || message.includes("503")) {
    return true;
  }

  // その他のエラーはリトライしない
  return false;
};

/**
 * 指定時間待機する
 * @param ms 待機時間（ミリ秒）
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * バックオフ戦略に基づいて遅延時間を計算
 * @param baseDelay 基本遅延時間（ミリ秒）
 * @param attempt 現在のリトライ回数（0始まり）
 * @param strategy バックオフ戦略
 */
const calculateDelay = (
  baseDelay: number,
  attempt: number,
  strategy: BackoffStrategy
): number => {
  if (strategy === "exponential") {
    // 指数関数的バックオフ: delay * 2^attempt
    return baseDelay * Math.pow(2, attempt);
  }
  // 線形バックオフ: 一定の遅延
  return baseDelay;
};

/**
 * 非同期関数をリトライ機能付きで実行する汎用ユーティリティ
 *
 * @example
 * ```typescript
 * // 基本的な使用法
 * const result = await withRetry(() => fetchData());
 *
 * // カスタム設定
 * const result = await withRetry(
 *   () => supabase.insert({...}),
 *   {
 *     maxRetries: 5,
 *     delay: 2000,
 *     backoff: 'exponential',
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry ${attempt}: ${error.message}`);
 *     }
 *   }
 * );
 * ```
 *
 * @param fn 実行する非同期関数
 * @param config リトライ設定
 * @returns 関数の実行結果
 * @throws 最大リトライ回数に達した場合、最後のエラーをスロー
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delay = 1000,
    backoff = "exponential",
    shouldRetry = defaultShouldRetry,
    onRetry,
  } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // リトライすべきかチェック
      if (!shouldRetry(lastError)) {
        throw lastError;
      }

      // 最後の試行でエラーが発生した場合はスロー
      if (attempt === maxRetries - 1) {
        throw new Error(
          `${NETWORK_ERRORS.RETRY_EXHAUSTED} (${lastError.message})`
        );
      }

      // リトライコールバックを呼び出し
      if (onRetry) {
        onRetry(lastError, attempt + 1, maxRetries);
      }

      // バックオフ戦略に基づいて待機
      const delayMs = calculateDelay(delay, attempt, backoff);
      await sleep(delayMs);
    }
  }

  // 理論上はここには到達しないが、TypeScriptの型チェックのため
  throw lastError || new Error("Unknown error");
}

/**
 * Supabase操作用のプリセット設定でリトライを実行
 *
 * supabase-js はクエリ失敗時に throw せず `{ error }` を resolve するため、
 * そのままでは withRetry の catch に入らずリトライが機能しない。
 * ここで `error` を例外に変換してからリトライ判定にかける。
 *
 * なお、リトライを使い切った場合は例外を投げるため、失敗を許容したい
 * 呼び出し側は try/catch すること。
 *
 * このヘルパーは insert などの書き込みにも使われるため、再送で二重登録に
 * なり得る 5xx はリトライ対象にしない（リクエスト未達の接続エラーのみ）。
 *
 * @example
 * ```typescript
 * const data = await withSupabaseRetry(() =>
 *   supabase.from('table').insert({...})
 * );
 * ```
 */
export async function withSupabaseRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(
    async () => {
      const result = await fn();

      // supabase-js はエラーを throw せず `{ error }` に詰めて resolve する。
      // リトライ可否を判定できるよう、例外に変換して投げ直す。
      if (
        result !== null &&
        typeof result === "object" &&
        "error" in result &&
        (result as { error: unknown }).error
      ) {
        throw new Error(getErrorMessage((result as { error: unknown }).error));
      }

      return result;
    },
    {
      maxRetries: 3,
      delay: 1000,
      backoff: "exponential",
      shouldRetry: isConnectionError,
      onRetry: (error, attempt, maxRetries) => {
        console.warn(
          `[Supabase] Retry ${attempt}/${maxRetries}: ${error.message}`
        );
      },
    }
  );
}
