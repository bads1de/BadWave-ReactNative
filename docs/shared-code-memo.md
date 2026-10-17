# Phase 0: 共通コード（web/desktop/mobile）統合メモ

3環境（badwave / badwave-desktop / badwave-mobile）は同じ系統のコードを
コピーして派生しており、共通部分が重複しつつ drift（乖離）している。
このファイルは統合・整理の進捗と知見を記録する。

## 背景（調査で判明した事実）

- web↔desktop は同一パスのソースファイルが **164個**（テスト除く）存在
- mobile は React Native のため UI は完全別物。パスが一致するのは型・定数・一部フック程度
  （web∩mobile パス一致は12ファイル、実体もほぼ別物）
- 中核ロジックは既に drift している:
  - `constants/errorMessages.ts` — 38行(web) / 78行(desktop) / 66行(mobile)
  - Zustand ストア — 永続化層が別物（**mobile=MMKV** / web・desktop=localStorage）
  - 型 `Song` — mobile は `local_song_path` 等のローカル用フィールドを持つ
- フレームワークが違う（web: React19 / desktop: React18 / mobile: React19）
  → 共有できるのは「フレームワーク非依存の純粋ロジック・純粋な型」のみ

## 統合の基本方針

- 闇雲に統合しない。**1ファイルずつ中身を読んで統合可否を判断**する
- 同じパスでも中身は2種類ある:
  1. **完全一致で統合できる**（純粋関数・フレームワーク非依存ロジック）
  2. **環境ごとに drift していて統合が危険**（値・構造が違うもの）
- 安易な統合は「同じキーを叩いても環境で挙動が変わるバグ」を生む

## 対応済み

### 1. `lib/utils/error.ts`（getErrorMessage）

- 状態: **3環境で実装が完全に同一**（統合候補）
- 対応: 実装に「3環境で完全に同一。変更時は3環境すべてに同じ差分を適用すること」
  という注記を追加（drift 防止の意識付け）
- 検証: mobile 9 テスト PASS、実コード差分ゼロ

### 2. `constants/errorMessages.ts`（ERROR_MESSAGES 他）

- 状態: **統合は見送り**（環境ごとにキー名・値・構造が異なる）
  - 値が異なる例: `TITLE_REQUIRED` は本環境「プレイリスト名を…」（web/desktop は「タイトルを…」）
  - キー名が異なる例: `SIGNOUT_FAILED`(AUTH_ERRORS) と `LOGOUT_FAILED`(web/desktop)
  - 構造が異なる例: 本環境は `AUTH_ERRORS` / `LIKE_ERRORS` / `PLAYLIST_ERRORS` /
    `NETWORK_ERRORS` 等の**カテゴリ別辞書**を持つ（web/desktop は単一のフラット辞書）
- 対応: `ERROR_MESSAGES` に「環境ごとにキー名・値・構造が異なる。統合・変更時は
  3環境すべてで差分を確認すること」という注意喚起コメントを追加（drift の可視化）
- 検証: tsc PASS、実コード差分ゼロ

### 3. `constants/ThemeColors.ts`（テーマ定義・mobile 側）

- 状態: **mobile は統合対象外** — web/desktop の `constants/colorSchemes.ts` とは
  テーマ集合（5テーマ vs 6プリセット）・キー構造（`theme300` 等の色キーが無い）が異なる
  - 参考: web↔desktop の `colorSchemes.ts` は `DEFAULT_COLOR_SCHEME_ID` の1行以外完全一致（相手側の統合候補）
- 対応: mobile は変更なし（web/desktop 側にのみ drift 防止注記を追加）
- 検証: 定数テスト mobile 62 / web 25 / desktop 33 件 + 3環境 tsc PASS。実コード差分ゼロ

### 4. `constants/index.ts`（純粋定数）

- 状態: **キー名・構造が web/desktop と異なり、ファイル全体では統合不可**。一致は:
  - 3環境同一: `CACHE_PREFIX`（"@query-cache"）/ `CACHE_CONFIG.staleTime`（10分）
  - 意図的な差: `CACHE_CONFIG.gcTime`（mobile=7日 / web/desktop=30分）
  - 別体系: `CACHED_QUERIES` / `SUPABASE_TABLES`（キー命名が異なる）/ `ROUTES`（Expo Router 形式）
  - 単位が異なる: `ANIMATION_DURATION`（ミリ秒）vs web/desktop の `DURATIONS`（秒）
- 対応: `constants/index.ts` 冒頭に「3環境で一致しているのは CACHE_PREFIX / staleTime のみ」の
  drift マップ注記を追加
- 検証: 定数テスト mobile 62 / web 25 / desktop 33 件 + 3環境 tsc PASS。実コード差分ゼロ

### 5. バイト一致ファイルの棚卸し（計測の固定）

- 確定値（2026-10-18）: web↔mobile は同一パス **12** ファイル・内容一致 **0**
  （背景の「12ファイル、実体もほぼ別物」を機械比較で確認）
- 比較スクリプトは web 側の `badwave/scripts/compare-shared-code.mjs`。
  web↔desktop 側の確定値（同一パス 164 / 内容一致 12）と「14 個」が再現しない件は web 側メモの 6 参照
- 検証: スクリプト出力のみ。コード変更なし

## 次の候補（未着手）

- ~~web 側で発見された `PROTECTED_ROUTES` の `"/playlist"`（単数）→ `"/playlists"` 整理~~:
  2026-10-18 に web 側で対応済み（`"/playlists"` に修正 + proxy/constants テスト追加）
- 将来的に `@badwave/shared` パッケージを作り、真実を1箇所に集約する

## 原則

- **「モノレポ化」と「共通化」は同時にやらない。**
  先に drift を解消してから、モノレポの器に載せるのが安全。
- mobile は React Native のため、共有できるのは純粋ロジック・純粋な型に限られる点に注意。
- 変更は「コメントのみ・挙動を変えない」安全パターンを徹底し、都度 tsc/テストで検証する。
