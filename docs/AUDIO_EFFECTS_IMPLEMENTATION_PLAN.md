# BadWave Mobile: Android Audio Effects 実装計画書 (詳細版)

## 1. 目的

`badwave-mobile` (Android 版) において、Web 版と同等の高度な音響エフェクト（イコライザー、リバーブ、ベースブースト等）をネイティブレベルで実現する。

## 2. 実装の柱

1. **Android Native Module (Kotlin)**: `DynamicsProcessing` および `AudioEffect` フレームワークを操作するカスタムブリッジ。
2. **TrackPlayer へのパッチ適用 (`patch-package`)**: `MusicService.kt` に 1 行の変更を加え、`AudioSessionId` を取得可能にする。
3. **Audio Session ID の動的監視**: 曲の切り替えに伴うセッション ID の変化をネイティブ側で検出し、エフェクトを自動再適用する。
4. **Vibe モード UI**: Web 版の操作感を継承した、プリセットベースのクイックエフェクト UI。

## 3. 技術的詳細

### 3.1. Android Native API の選択 (API 28+)

従来の簡易的な `Equalizer` クラスではなく、より高度な制御が可能な **`DynamicsProcessing`** を採用します。

- **Equalizer stage**: 任意のバンド数（Web 版と同様の 6 バンド以上）を設定可能。
- **Limiter stage**: エフェクト適用による音割れ（クリッピング）を防止。
- **BassBoost / EnvironmentalReverb**: 空間表現のためにこれらを組み合わせて使用。

### 3.2. 実装のキモ: AudioSessionId の取得 (パッチ戦略)

`react-native-track-player` の内部から `AudioSessionId` を露出させるため、以下の最小限の変更を行います。

- **対象**: `node_modules/react-native-track-player/android/src/main/java/com/doublesymmetry/trackplayer/service/MusicService.kt`
- **手法**: `patch-package` を使用し、再生時に `AudioSessionId` を取得してカスタム Native Module へ通知するコードを 1 行挿入する。
- **メリット**: ライブラリ本体を大きく改造せず、既存の安定性を維持したままエフェクト機能を追加できる。
- **インスタンス管理**: セッションごとにエフェクトインスタンスを生成し、リークしないよう適切に解放（release）する。

### 3.3. Vibe プリセットの定義

| プリセット名        | イコライザー (Low/Mid/High) | リバーブ    | その他               |
| :------------------ | :-------------------------- | :---------- | :------------------- |
| **Normal**          | Flat (0dB)                  | OFF         | -                    |
| **Dance Hall**      | High cut (-15dB @ 2k+)      | Deep Room   | こもった音を再現     |
| **Slowed + Reverb** | Warm (+2dB Low)             | Medium Hall | 速度 0.85x           |
| **Sped Up**         | Bright (+3dB High)          | OFF         | 速度 1.25x           |
| **Extreme Bass**    | Heavy Boost (+10dB @ 60Hz)  | OFF         | BassBoost クラス使用 |

## 4. 開発ロードマップ (TDD ベース)

### フェーズ 1: ネイティブ・プロトタイプ

- [ ] `AudioEffectsModule.kt` のスケルトン作成。
- [ ] 音声セッション ID を JS 側に定期的、あるいはイベントとして通知する仕組み。

### フェーズ 2: エフェクトロジックの実装

- [ ] `DynamicsProcessing` の初期化とバンド設定。
- [ ] 各パラメーター（Gain, Bandwidth, Reverb Wet）を JS から動的に変更するブリッジ。

### フェーズ 3: プレイヤー画面への統合

- [ ] `useAudioEffects.ts` ホックによる状態管理。
- [ ] プレイヤー画面（`Player.tsx`）への「Vibe」ボタンと BottomSheet の追加。

### フェーズ 4: 安定化

- [ ] 曲をまたいだ際のエフェクト継続テスト。
- [ ] アプリ再起動時の設定復元ロジック。

## 5. 制限事項

- Android API 28 (Android 9) 以上を推奨ターゲットとする。
- iOS 版は現時点では対象外とし、機能自体を隠蔽する。

---

最終更新: 2026-01-14
ステータス: 実装開始準備完了
