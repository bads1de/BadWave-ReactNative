# Quick Listen 機能設計書

## 1. 概要

**Quick Listen** は、ユーザーが曲を素早くプレビューし、お気に入りの曲を発見できる Spotify 風のショートプレビュー機能です。

TikTok/Reels/Spotify のプレビュー機能にインスパイアされた、縦スワイプ型の全画面プレビュー体験を提供します。

### 1.1 目的

- ユーザーがより多くの曲を短時間で試聴できるようにする
- 曲の発見（ディスカバリー）体験を向上させる
- アプリのエンゲージメントを高める

### 1.2 対象コンテンツ

| コンテンツタイプ   | 対応 | 備考                                  |
| ------------------ | ---- | ------------------------------------- |
| **音声のみ（曲）** | ✅   | アルバムアートを背景に表示            |
| **動画付きの曲**   | ✅   | 動画をループ再生（Spotlights と同様） |

---

## 2. ユーザーストーリー

1. ユーザーとして、TopPlayed セクションの曲をタップしたら、その曲から Quick Listen モードに入りたい。
2. ユーザーとして、縦にスワイプして次/前の曲に移動したい。
3. ユーザーとして、気に入った曲を「いいね」したり、プレイリストに追加したい。
4. ユーザーとして、「フルで聴く」ボタンでメインプレイヤーに曲を渡して再生を続けたい。
5. ユーザーとして、下にスワイプダウンまたは「×」ボタンで Quick Listen を閉じたい。

---

## 3. UI/UX デザイン

### 3.1 画面構成

```
┌─────────────────────────────────────────┐
│  ← (閉じるボタン)                        │
│                                         │
│                                         │
│     ┌───────────────────────────┐       │
│     │                           │       │
│     │   [アルバムアート/動画]    │       │
│     │                           │       │
│     └───────────────────────────┘       │
│                                         │
│         曲タイトル                       │
│         アーティスト名                   │
│                                         │
│   ─────────────────────────────────     │  ← プログレスバー
│                                         │
│   [❤️ いいね] [➕ 追加] [▶️ フルで聴く]   │  ← アクションボタン
│                                         │
└─────────────────────────────────────────┘
```

### 3.2 インタラクション

| ジェスチャー    | アクション                     |
| --------------- | ------------------------------ |
| 上スワイプ      | 次の曲へ                       |
| 下スワイプ      | 前の曲へ（先頭の場合は閉じる） |
| タップ（画像）  | 再生/一時停止                  |
| 左上「←」タップ | 閉じる                         |

### 3.3 ビジュアル

- **背景**: アルバムアートのブラー + 暗めのグラデーション
- **コンテンツ**: 中央にアルバムアート（角丸）または動画（動画がある場合）
- **テキスト**: 白文字 + シャドウ
- **プログレスバー**: 薄紫（#a78bfa）、アニメーション付き
- **アクションボタン**: ガラスモーフィズム風のボタン

---

## 4. 技術設計

### 4.1 アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                      QuickListenScreen                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                    QuickListenList                      ││
│  │  (FlashList - 縦スワイプ)                               ││
│  │  ┌─────────────────────────────────────────────────────┐││
│  │  │               QuickListenItem                       │││
│  │  │  - useQuickListenPlayer (音声/動画の再生制御)       │││
│  │  │  - QuickListenControls (アクションボタン群)         │││
│  │  └─────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 4.2 ディレクトリ構成

```
components/
├── quickListen/
│   ├── QuickListenScreen.tsx      # メイン画面（Modal or 全画面）
│   ├── QuickListenList.tsx        # FlashListラッパー
│   ├── QuickListenItem.tsx        # 1曲分のUI
│   └── QuickListenControls.tsx    # アクションボタン群

hooks/
├── useQuickListenPlayer.ts        # 音声/動画再生制御フック
├── stores/
│   └── useQuickListenStore.ts     # Zustand状態管理
```

### 4.3 状態管理（Zustand）

```typescript
// useQuickListenStore.ts
type QuickListenState = {
  isVisible: boolean;
  songs: Song[];
  currentIndex: number;
  previewDuration: number; // 秒
};

type QuickListenActions = {
  // アトミック更新：一発で開く
  open: (songs: Song[], startIndex: number) => void;
  close: () => void;
  setCurrentIndex: (index: number) => void;
};
```

**重要**: `open` アクションで `songs`, `currentIndex`, `isVisible` を**一度に更新**することで、レースコンディションを防止。

### 4.4 再生制御フック

```typescript
// useQuickListenPlayer.ts
export const useQuickListenPlayer = (song: Song, isVisible: boolean) => {
  // 動画がある場合は expo-video を使用
  // 音声のみの場合は expo-audio を使用

  const hasVideo = !!song.video_path;

  if (hasVideo) {
    // expo-video (useVideoPlayer)
  } else {
    // expo-audio (useAudioPlayer)
  }

  // isVisible が true の時のみ再生
  // isVisible が false になったら一時停止

  return { player, isPlaying, togglePlay };
};
```

### 4.5 リスト実装

```typescript
// QuickListenList.tsx
<FlashList
  data={songs}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  pagingEnabled
  showsVerticalScrollIndicator={false}
  snapToInterval={height}
  decelerationRate="fast"
  onViewableItemsChanged={handleViewableItemsChanged}
  viewabilityConfig={viewabilityConfig}
  estimatedItemSize={height}
  drawDistance={height}
  extraData={currentIndex}
/>
```

---

## 5. データフロー

### 5.1 Quick Listen を開く

```
[ユーザー: TopPlayedのカードをタップ]
    ↓
[TopPlayedSongsList: handleSongPress(index)]
    ↓
[QuickListenStore: open(songs, index)]
    ↓
[QuickListenScreen: isVisible=true → 表示]
    ↓
[QuickListenList: currentIndexにスクロール]
    ↓
[QuickListenItem: isVisible=true → 再生開始]
```

### 5.2 スワイプで曲を切り替える

```
[ユーザー: 上スワイプ]
    ↓
[FlashList: onViewableItemsChanged]
    ↓
[QuickListenStore: setCurrentIndex(newIndex)]
    ↓
[旧QuickListenItem: isVisible=false → 一時停止]
[新QuickListenItem: isVisible=true → 再生開始]
```

### 5.3 フルで聴く

```
[ユーザー: 「フルで聴く」ボタンをタップ]
    ↓
[QuickListenControls: handlePlayFull]
    ↓
[QuickListenStore: close()]
    ↓
[TrackPlayer: キューに追加して再生]
    ↓
[PlayerStore: showPlayer=true]
```

---

## 6. 実装計画

### Phase 1: 基盤構築（安定性優先）

1. **`useQuickListenStore.ts` の作成**

   - アトミックな `open` アクションを実装
   - 既存の `useSubPlayerStore` を置き換え

2. **`QuickListenList.tsx` の作成**

   - FlashList ベースの縦スワイプリスト
   - Spotlights と同様の実装パターン

3. **`useQuickListenPlayer.ts` の作成**
   - 音声のみの曲: `expo-audio` で再生
   - 動画付きの曲: `expo-video` で再生

### Phase 2: UI/UX 改善

1. **`QuickListenItem.tsx` の作成**

   - リッチなビジュアル（ブラー、グラデーション）
   - プログレスバーのアニメーション

2. **`QuickListenControls.tsx` の作成**

   - いいねボタン（ハート）
   - プレイリストに追加ボタン
   - フルで聴くボタン

3. **`QuickListenScreen.tsx` の作成**
   - 全画面モーダル
   - 閉じるボタン

### Phase 3: 統合とテスト

1. **`TopPlayedSongsList` の更新**

   - 既存の `handleSongPress` を `QuickListenStore.open` に置き換え

2. **旧 `SubPlayer` の削除**

   - 新しい Quick Listen に完全に置き換え

3. **テストの作成**
   - ユニットテスト
   - 統合テスト

---

## 7. 既存コードとの関係

| 既存コンポーネント       | 対応                                         |
| ------------------------ | -------------------------------------------- |
| `SubPlayer.tsx`          | **削除** → `QuickListenScreen` に置き換え    |
| `useSubPlayerStore.ts`   | **削除** → `useQuickListenStore` に置き換え  |
| `useSubPlayerAudio.ts`   | **削除** → `useQuickListenPlayer` に置き換え |
| `TopPlayedSongsList.tsx` | **修正** → `handleSongPress` を更新          |
| `PlayerContainer.tsx`    | **修正** → `SubPlayer` の参照を削除          |

---

## 8. 今後の拡張

- **ハッシュタグ/ジャンルタグ**: プレビュー画面にジャンルタグを表示し、タップでそのジャンルのフィードに移動
- **シェア機能**: 曲を SNS にシェア
- **オートプレイ設定**: 自動で次の曲に進むかどうかのオプション
- **ビジュアライザー**: 音声波形のアニメーション表示

---

## 9. 成功指標

- **安定性**: 曲をタップした時に、必ず正しい曲が再生される
- **パフォーマンス**: 100 曲スワイプしてもメモリリークや遅延がない
- **UX**: Spotify や TikTok に匹敵するスムーズな操作感
