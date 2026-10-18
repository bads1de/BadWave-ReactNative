# 依存関係・脆弱性メモ（badwave-mobile）

> npm audit / Dependabot への対応記録と、意図的に先送りしている項目の理由を残す。
> 数値・判断は 2026-10-18 時点。

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
| GHSA-vfj7-8cjw-p6xm | braces | high | **なし**（3.0.3 が最新） | jest / metro-file-map 経由の dev・ビルド時のみ。修正版が出たら override 候補。SDK 58 の jest-expo 58.0.7+ は修正扱い |
| GHSA-86w9-cpqp-85rv | node-forge | high | **なし**（1.4.0 が最新） | @expo/cli のコード署名（ビルド時）専用。アプリ実行時には入らない |
| GHSA-vcc3-ghjq-m6fr | decode-uri-component | moderate | 0.5.0（**ESM-only**） | 実行時に到達しうる唯一（expo-router → query-string@7）。0.5.0 は ESM 専用で CJS の query-string@7 からは使えないため override しない。**SDK 58 移行で解消**（expo-router 58 は query-string 依存自体を削除） |
| GHSA-hp3w-g68c-fv3c | sprintf-js | moderate | **なし** | js-yaml@3 系（babel-plugin-istanbul = カバレッジ計測、dev 専用）。ローカル設定ファイル用で実害なし |

除外した対処: `npm audit fix --force` は jest-expo@58 / expo-router@58 等を入れる
＝ SDK 58 の片足移行になるため使用しない。

## 3. expo-doctor の既存指摘（本更新の前から存在。未対応）

- **duplicate native module**: `react-native-screens` 4.25.2（root、exact pin）＋ 4.28.0（expo-router 配下）。
  expo-router は `^4.26.0` を要求しているため重複中。root を SDK 57 推奨の `~4.26.0` に上げると解消
  （**ネイティブ再ビルドが必要**）
- **Hermes V1 回帰**: RN 0.86.0 の Hermes に既知の回帰（修正は RN 0.86.2+）。
  `expo install --fix` で RN 0.86.3 を含む 16 パッケージのバージョン整合が可能（こちらも再ビルド推奨）
  - 注意: `expo install --fix` は `@shopify/flash-list` を 2.3.2 → ~2.0.2 に**ダウングレード**する
    （SDK 57 の検証済みバージョンに合わせるため）。意図的に 2.x 最新を使いたい場合は
    `expo.install.exclude` への追加を検討

## 4. 次の一手（候補）

- `npx expo install --fix` による 16 パッケージの整合（Hermes 回帰修正・screens 重複解消。要ネイティブ再ビルド）
- Expo SDK 58 移行（decode-uri-component moderate の解消を含む。jest 系アラートの整理も期待）
