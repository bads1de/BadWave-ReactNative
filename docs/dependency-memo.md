# 依存関係・脆弱性メモ（badwave-mobile）

> npm audit / Dependabot への対応記録と、意図的に先送りしている項目の理由を残す。
> 数値・判断は 2026-10-21 時点（第 2 版）。

## 1. npm audit fix（非破壊のみ）を適用 — 2026-10-18

- `npm audit fix` を実行（package-lock.json のみ更新。package.json は不変）
- 解消したもの:
  - `shell-quote` **critical**（GHSA-pqg4-j6r4-53mv、1.10.0 → 1.12.0）※react-devtools-core 経由（開発時のみ）
  - `source-map-js` **high**（GHSA-68fv-2mgg-jv7q、1.2.1 → 1.2.2）※postcss 経由（ビルド時のみ）
  - `@expo/metro-file-map` 57.0.3 → 57.0.4（micromatch 依存が外れたパッチ）
  - あわせて Expo SDK 57 内の最新パッチへ更新（52 パッケージ更新 + 2 追加）。
    expo 57.0.30 / expo-router 57.0.28 / jest-expo 57.0.6 / @react-native/jest-preset 0.86.3 など
- npm 集計: 56 → 53 vulnerabilities（**critical 1 → 0**）
- GitHub Dependabot 通知: 6 件 → 4 件になる見込み（critical と high 1 件が消える）
- 検証: jest 173 スイート / 1049 テスト PASS、`tsc --noEmit` PASS、
  `npx expo export --platform android` 成功（Hermes バンドル生成）
  - 参考: web への export は `@rntp/player`（ネイティブ専用）が解決できず失敗する
    （本変更とは無関係の既存制約）

## 2. 残アラート 4 件と先送り理由（2026-10-18）

| advisory | package | 深刻度 | 修正版 | 理由・方針 |
| --- | --- | --- | --- | --- |
| GHSA-vfj7-8cjw-p6xm | braces | high | **なし**（3.0.3 が最新） | jest / metro-file-map 経由の dev・ビルド時のみ。修正版が出たら override 候補。SDK 58 の jest 30.5 系は micromatch を picomatch に置換済みで jest ツリーからは消えるが、`metro-file-map@0.87.1` は依然 micromatch 依存のためビルド系には残る |
| GHSA-86w9-cpqp-85rv | node-forge | high | **なし**（1.4.0 が最新） | @expo/cli のコード署名（ビルド時）専用。アプリ実行時には入らない |
| GHSA-vcc3-ghjq-m6fr | decode-uri-component | moderate | 0.5.0（**ESM-only**） | 実行時に到達しうる唯一（expo-router → query-string@7）。0.5.0 は ESM 専用で CJS の query-string@7 からは使えないため override しない。**SDK 58 移行で解消**（expo-router 58 は query-string 依存自体を削除） |
| GHSA-hp3w-g68c-fv3c | sprintf-js | moderate | **なし** | js-yaml@3 系（babel-plugin-istanbul = カバレッジ計測、dev 専用）。ローカル設定ファイル用で実害なし |

除外した対処: `npm audit fix --force` は jest-expo@58 / expo-router@58 等を入れる
＝ SDK 58 の片足移行になるため使用しない。

## 3. expo install --fix による SDK 57 整合 — 2026-10-21

expo-doctor が指摘していた実害のある 2 件（Hermes V1 回帰・native module 重複）を解消した。

- `npx expo install --fix` で 15 パッケージを SDK 57 期待バージョンへ更新:
  - **react-native 0.86.0 → 0.86.3**（Hermes V1 回帰の修正を含む）
  - **react-native-screens 4.25.2 → ~4.26.0**（expo-router の要求 `^4.26.0` と一致）
  - react-native-reanimated 4.5.0 → 4.5.1 / react-native-worklets 0.10.0 → 0.10.1（ペア）
  - expo-dev-client ~57.0.20、expo-linking ~57.0.13、expo-image ~57.0.5、expo-sqlite ~57.0.4 ほか
  - eslint-config-expo ~57.0.2
- `@shopify/flash-list` は `expo.install.exclude` に追加して **2.3.2 を維持**
  （SDK 57 検証値は 2.0.2 だが、2.3.2 は SDK 58 の期待値でもあるためダウングレードしない）
- `npm dedupe` で expo-router 配下に残っていた react-native-screens 4.28.0 を除去
  → **4.26.2 の単一バージョンに統一**
- npm audit の集計は **変わらず 53 件（8 moderate / 45 high / 0 critical）**。
  残アラートは前節の 4 件で、今回の更新では消えない（修正版が存在しないため）
- 検証: jest 173 スイート / 1049 テスト PASS、`tsc --noEmit` PASS、
  `npx expo-doctor` **21/21 パス**、`npx expo export --platform android` 成功（Hermes 8.4MB）
- **ネイティブ再ビルドが必要**（RN / screens / reanimated / worklets / expo-dev-client はネイティブ側の更新のため）

## 4. SDK 58 の調査結果（未実施）

上流の修正状況を確認したうえでの着地点。SDK 58 は「アラート削減」と「破壊的変更」のトレードオフが大きい。

- SDK 58 の期待バージョン: react-native **0.88.0** / react **19.3.0** / react-native-screens ~4.30.0 /
  reanimated 4.7.1 / worklets 0.13.0 / expo-router ~58.0.24 / jest-expo ~58.0.11 /
  @shopify/flash-list **2.3.2**（現行維持でちょうど一致）
- 消えるもの:
  - **decode-uri-component moderate**: expo-router 58 は query-string 依存自体を削除
  - **jest 系の braces 重複（npm 上の 45 high の大半）**: jest 30.5 系が micromatch → picomatch に移行
- 残るもの:
  - **braces high**: `metro-file-map@0.87.1` が依然 micromatch → braces（ビルド時のみ）
  - **node-forge high**: 全バージョン未修正（@expo/cli のコード署名＝ビルド時のみ）
  - **sprintf-js moderate**: js-yaml@3 系（カバレッジ計測、dev 専用）
- したがって SDK 58 に上げても GitHub 上のアラートは 4 → 2〜3 件程度。
  RN 0.86 → 0.88 / React 19.2.3 → 19.3 のネイティブ移行を伴うため、単独タスクとして実施する。

## 5. 次の一手（候補）

- ネイティブ再ビルド（`npx expo run:android` など）で今回の SDK 57 整合を反映
- Expo SDK 58 移行は別タスクとして計画（decode-uri-component の解消・jest 系アラート整理）
- braces / node-forge / sprintf-js は上流の修正版待ち。定期的に `npm view <pkg> version` で確認
