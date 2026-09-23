/**
 * PostgREST フィルタ構文へ値を埋め込む際のエスケープヘルパー。
 *
 * supabase-js の `.or()` / `ilike` は文字列結合でクエリを組み立てるため、
 * ユーザー入力をそのまま埋め込むと構文文字や LIKE ワイルドカードとして
 * 解釈され、フィルタが意図せず広がる。
 */

/**
 * `.or()` の `ilike` 部分一致フィルタに埋め込む値を組み立てる。
 *
 * - ユーザー入力の `\` `%` `_` : LIKE / ILIKE のワイルドカードとして解釈されないよう `\` を前置
 * - パターン全体を二重引用符で括り、内部の `"` は二重化する。
 *   `,` `.` `:` `*` `(` `)` 等の予約文字が `.or()` パーサの構文文字
 *   （フィルタ区切り・グループ等）として解釈されるのを防ぐ。
 *   `\` エスケープでは `.or()` パーサのカンマ分割を止められないため、
 *   予約文字は `\` ではなく二重引用符で無害化する。
 *
 * @param value エスケープする生の値
 * @returns `"%…%"` 形式の引用符付き部分一致パターン
 */
export function escapePostgrestOrValue(value: string): string {
  const likeEscaped = value.replace(/[\\%_]/g, (ch) => `\\${ch}`);
  return `"%${likeEscaped.replace(/"/g, '""')}%"`;
}

export default escapePostgrestOrValue;
