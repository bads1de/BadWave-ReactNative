/**
 * 認証エラーメッセージ定数
 */
export const AUTH_ERRORS = {
  USER_ID_REQUIRED: "ユーザーIDが必要です",
  ADMIN_REQUIRED: "管理者権限が必要です",
  SESSION_REQUIRED: "セッションが存在しません",
  EMAIL_PASSWORD_REQUIRED: "メールアドレスとパスワードを入力してください",
  PASSWORD_MISMATCH: "パスワードが一致しません",
  GOOGLE_SIGNIN_FAILED: "Googleログインに失敗しました",
  GOOGLE_SIGNIN_IN_PROGRESS: "ログイン処理が既に実行中です",
  PLAY_SERVICES_UNAVAILABLE: "Google Play Servicesが利用できません",
} as const;

/**
 * 認証の成功・案内メッセージ定数
 */
export const AUTH_MESSAGES = {
  SIGNUP_CONFIRM_EMAIL_SENT: "確認メールを送信しました！メールをご確認ください。",
} as const;

/**
 * いいね操作のエラーメッセージ定数
 */
export const LIKE_ERRORS = {
  OFFLINE: "オフライン時はいいねの操作ができません",
  SUPABASE_DELETE_FAILED: "いいねの解除に失敗しました",
  SUPABASE_INSERT_FAILED: "いいねの追加に失敗しました",
} as const;

/**
 * プレイリスト操作のエラーメッセージ定数
 */
export const PLAYLIST_ERRORS = {
  OFFLINE: "オフライン時はプレイリストの作成ができません",
  EDIT_OFFLINE: "オフライン時はプレイリストの編集操作ができません",
  SUPABASE_DELETE_FAILED: "プレイリストからの削除に失敗しました",
  ADD_SONG_FAILED: "プレイリストへの曲の追加に失敗しました",
  REMOVE_SONG_FAILED: "プレイリストからの曲の削除に失敗しました",
} as const;

/**
 * ネットワーク関連エラーメッセージ定数
 */
export const NETWORK_ERRORS = {
  RETRY_EXHAUSTED: "リトライ回数を超過しました",
  OFFLINE: "オフラインです",
  TIMEOUT: "タイムアウトしました",
} as const;

/**
 * 汎用エラーメッセージ定数 (badwave-mobile)
 */
export const ERROR_MESSAGES = {
  ADMIN_REQUIRED: "管理者権限が必要です",
  USER_ID_REQUIRED: "ユーザーIDが必要です",
  TITLE_REQUIRED: "プレイリスト名を入力してください",
  EDIT_FAILED: "編集に失敗しました",
  DELETE_FAILED: "削除に失敗しました",
  POST_FAILED: "投稿に失敗しました",
  GENERIC_ERROR: "エラーが発生しました",
  GENERIC_ERROR_RETRY: "エラーが発生しました。もう一度お試しください。",
  SONG_NOT_FOUND: "曲が見つかりません",
  FETCH_FAILED: "データの取得に失敗しました",
} as const;
