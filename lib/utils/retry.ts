import { NETWORK_ERRORS } from "@/constants/errorMessages";

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
 * デフォルトのリトライ判定関数
 * ネットワークエラーや一時的なエラーの場合にリトライする
 */
const defaultShouldRetry = (error: Error): boolean => {
  // ネットワークエラーはリトライ
  if (
    error.message.includes("Network") ||
    error.message.includes("network") ||
    error.message.includes("timeout") ||
    error.message.includes("ECONNREFUSED") ||
    error.message.includes("ETIMEDOUT")
  ) {
    return true;
  }

  // 一時的なサーバーエラー（5xx）はリトライ
  if (error.message.includes("500") || error.message.includes("503")) {
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
 * @example
 * ```typescript
 * const data = await withSupabaseRetry(() =>
 *   supabase.from('table').insert({...})
 * );
 * ```
 */
export async function withSupabaseRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxRetries: 3,
    delay: 1000,
    backoff: "exponential",
    onRetry: (error, attempt, maxRetries) => {
      console.warn(
        `[Supabase] Retry ${attempt}/${maxRetries}: ${error.message}`
      );
    },
  });
}
