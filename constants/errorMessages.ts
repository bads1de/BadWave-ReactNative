/**
 * アプリケーション全体で使用するエラーメッセージの定数
 * エラー文言を一元管理し、保守性と国際化対応を容易にする
 */

/**
 * 認証関連のエラーメッセージ
 */
export const AUTH_ERRORS = {
  USER_ID_REQUIRED: "ユーザーIDが必要です",
  NOT_AUTHENTICATED: "ログインが必要です",
  SESSION_EXPIRED: "セッションが期限切れです。再度ログインしてください",
} as const;

/**
 * ネットワーク関連のエラーメッセージ
 */
export const NETWORK_ERRORS = {
  OFFLINE: "オフライン時はこの操作ができません",
  CONNECTION_FAILED: "接続に失敗しました。ネットワーク環境を確認してください",
  TIMEOUT: "リクエストがタイムアウトしました",
  RETRY_EXHAUSTED: "リトライ回数の上限に達しました。後でもう一度お試しください",
} as const;

/**
 * いいね機能のエラーメッセージ
 */
export const LIKE_ERRORS = {
  OFFLINE: "いいね機能にはインターネット接続が必要です",
  MUTATION_FAILED: "いいね操作に失敗しました。もう一度お試しください",
  SUPABASE_INSERT_FAILED: "Supabase追加エラー",
  SUPABASE_DELETE_FAILED: "Supabase削除エラー",
} as const;

/**
 * プレイリスト機能のエラーメッセージ
 */
export const PLAYLIST_ERRORS = {
  OFFLINE: "オフライン時はプレイリストを作成できません",
  EDIT_OFFLINE: "オフライン時はプレイリストの編集ができません",
  CREATION_FAILED: "プレイリストの作成に失敗しました",
  ADD_SONG_FAILED: "プレイリストへの曲の追加に失敗しました",
  REMOVE_SONG_FAILED: "プレイリストからの曲の削除に失敗しました",
  SUPABASE_INSERT_FAILED: "Supabase追加エラー",
  SUPABASE_DELETE_FAILED: "Supabase削除エラー",
} as const;

/**
 * 成功メッセージ
 */
export const SUCCESS_MESSAGES = {
  LIKED: "いいねしました！",
  UNLIKED: "いいねを解除しました",
  PLAYLIST_CREATED: "プレイリストを作成しました",
  SONG_ADDED: "曲を追加しました",
  SONG_REMOVED: "曲を削除しました",
} as const;

/**
 * ユーザー向けのアクションメッセージ
 */
export const ACTION_MESSAGES = {
  TRY_AGAIN: "もう一度お試しください",
  CHECK_CONNECTION: "インターネット接続を確認してください",
  LOGIN_REQUIRED: "いいね機能を使うにはログインしてください",
} as const;

/**
 * デバッグ用のエラープレフィックス（開発時のみ表示）
 */
export const DEBUG_PREFIXES = {
  SUPABASE: "[Supabase]",
  LOCAL_DB: "[LocalDB]",
  NETWORK: "[Network]",
  MUTATION: "[Mutation]",
} as const;
