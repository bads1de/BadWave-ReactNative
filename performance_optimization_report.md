# 音楽アプリのパフォーマンス最適化総合レポート

## 概要

このレポートでは、音楽アプリのパフォーマンス分析と最適化提案をまとめています。コードベースの詳細な分析に基づき、パフォーマンスのボトルネックを特定し、具体的な改善策を提案します。

## 現状の分析

### コンポーネント構造とレンダリングパフォーマンス

#### プレーヤーコンポーネントの階層

- PlayerContainer、Player、MiniPlayer、SubPlayer の複雑な階層構造
- コンポーネント間の状態共有による不要な再レンダリングの可能性
- メモ化の使用は適切だが、依存配列の最適化の余地あり

#### 画像処理の最適化

- expo-image を使用しているが、cachePolicy 設定にばらつきがある
- 画像のプリロードと遅延読み込みの戦略が不明確
- 大きな画像リソースのサイズ最適化が不十分

### 状態管理とデータフロー

#### Zustand ストアの分割

- useAudioStore、usePlayerStore、useSubPlayerStore など複数のストアが存在
- ストア間の依存関係と更新タイミングの管理が複雑
- 状態の正規化が不十分で、重複データの可能性あり

#### React Query の使用

- キャッシュ戦略の最適化が不十分
- staleTime と gcTime の設定が明示的でない
- バックグラウンドでの更新戦略が不明確

### オーディオ処理とリソース管理

#### 複数のオーディオエンジン

- メインプレーヤーは react-native-track-player を使用
- SubPlayer は expo-av を直接使用
- 2 つの異なるオーディオエンジン間の連携と競合の可能性

#### リソース解放の問題

- コンポーネントのアンマウント時のクリーンアップが不十分
- 音声リソースの解放タイミングが不明確
- メモリリークの可能性

## 最適化提案

### レンダリングパフォーマンスの改善

#### コンポーネントの最適化

- **提案**: 不要な再レンダリングを削減し、コンポーネント階層を簡素化する
- **実装方法**:
  - React.memo の依存配列を最適化
  - コンポーネント分割の見直しと責務の明確化
  - useCallback と useMemo の適切な使用

```typescript
// 改善例: 最適化されたメモ化コンポーネント
const MemoizedPlayerControls = memo(PlayerControls, (prevProps, nextProps) => {
  // 必要な変更がある場合のみ再レンダリング
  return (
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.repeatMode === nextProps.repeatMode &&
    prevProps.shuffle === nextProps.shuffle
  );
});
```

#### 画像処理の最適化

- **提案**: 画像読み込みとキャッシュ戦略を統一し最適化する
- **実装方法**:
  - cachePolicy を一貫して「memory-disk」に設定
  - 画像サイズの最適化とリサイズ戦略の導入
  - 画像のプリロードを重要な画像のみに限定

```typescript
// 改善例: 最適化された画像コンポーネント
<Image
  source={{ uri: optimizeImageUrl(song.image_path) }} // サイズ最適化関数
  style={styles.image}
  contentFit="cover"
  cachePolicy="memory-disk"
  transition={200} // フェードイン効果
  placeholder={blurhash} // ローディングプレースホルダー
/>
```

### 状態管理の最適化

#### Zustand ストアの最適化

- **提案**: ストア設計を見直し、更新頻度に基づいて分割する
- **実装方法**:
  - 頻繁に更新される状態と安定した状態を分離
  - セレクタの使用による不要な再レンダリングの防止
  - ミドルウェアを活用したデバッグと永続化

```typescript
// 改善例: 最適化されたZustandストア
import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

export const usePlayerStore = create(
  subscribeWithSelector((set, get) => ({
    // 状態
    showPlayer: false,

    // アクション
    setShowPlayer: (value) => set({ showPlayer: value }),

    // 複合アクション
    togglePlayer: () => set({ showPlayer: !get().showPlayer }),
  }))
);

// 最適化されたセレクタ
export const usePlayerVisibility = () =>
  usePlayerStore((state) => state.showPlayer);
```

#### React Query の最適化

- **提案**: クエリ設定とキャッシュ戦略を最適化する
- **実装方法**:
  - 個別のクエリ設定を見直し、適切な staleTime と gcTime を設定
  - データの事前読み込みと遅延読み込みを実装
  - キャッシュの無効化戦略を改善

```typescript
// 改善例: 最適化されたReact Queryの設定
const { data: topSongs = [] } = useQuery({
  queryKey: [CACHED_QUERIES.topPlayedSongs, userId],
  queryFn: () => getTopPlayedSongs(userId),
  enabled: !!userId,
  staleTime: 1000 * 60 * 5, // 5分間
  gcTime: 1000 * 60 * 30, // 30分間
  refetchOnMount: false,
  refetchOnWindowFocus: false,
});
```

### オーディオ処理の最適化

#### オーディオエンジンの統一

- **提案**: 可能な限りオーディオエンジンを統一し、リソース競合を減らす
- **実装方法**:
  - SubPlayer も react-native-track-player を使用するよう検討
  - または明確な分離戦略を実装し、相互干渉を防止
  - オーディオセッションの管理を一元化

```typescript
// 改善例: オーディオセッション管理の一元化
const AudioSessionManager = {
  async configureSession(isSubPlayer = false) {
    // 共通の設定
    const baseConfig = {
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    };

    // プレーヤータイプに応じた設定
    const config = isSubPlayer
      ? {
          ...baseConfig,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        }
      : {
          ...baseConfig,
          interruptionModeIOS: InterruptionModeIOS.DuckOthers,
          interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
        };

    await Audio.setAudioModeAsync(config);
  },
};
```

#### リソース管理の改善

- **提案**: 音声リソースの確実な解放とメモリ管理を改善する
- **実装方法**:
  - useEffect のクリーンアップ関数を徹底
  - エラーハンドリングとリソース解放を分離
  - 明示的なリソース解放タイミングの設定

```typescript
// 改善例: 適切なリソース解放
useEffect(() => {
  let isMounted = true;
  let sound = null;

  const loadSound = async () => {
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.song_path },
        { shouldPlay: false }
      );

      if (isMounted) {
        sound = newSound;
        // 他の初期化処理
      } else {
        // コンポーネントがアンマウントされていたら即座に解放
        await newSound.unloadAsync();
      }
    } catch (error) {
      console.error("Sound loading error:", error);
    }
  };

  loadSound();

  return () => {
    isMounted = false;
    if (sound) {
      sound.unloadAsync().catch(() => {});
    }
  };
}, [song.song_path]);
```

### アニメーションと UI 応答性の改善

#### Reanimated の最適化

- **提案**: アニメーションのパフォーマンスを最適化し、メインスレッドの負荷を軽減
- **実装方法**:
  - worklet の活用による JS-ネイティブ間通信の削減
  - 共有値の適切な使用と依存関係の最小化
  - 不要なアニメーションの削除または簡素化

```typescript
// 改善例: 最適化されたアニメーション
const animatedStyle = useAnimatedStyle(() => {
  "worklet";
  return {
    transform: [
      { scale: withTiming(pressed.value ? 0.95 : 1, { duration: 100 }) },
    ],
    opacity: withTiming(pressed.value ? 0.9 : 1, { duration: 100 }),
  };
});
```

#### ジェスチャー処理の最適化

- **提案**: タッチ応答性を向上させ、ジェスチャー処理を最適化
- **実装方法**:
  - Gesture Handler の適切な設定
  - 複雑なジェスチャーの簡素化
  - ジェスチャー処理のメインスレッドからの分離

```typescript
// 改善例: 最適化されたジェスチャー処理
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const tap = Gesture.Tap()
  .maxDuration(250)
  .onStart(() => {
    runOnJS(onPress)();
  });

return (
  <GestureDetector gesture={tap}>
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* コンテンツ */}
    </Animated.View>
  </GestureDetector>
);
```

### バックグラウンド処理とメモリ管理

#### バックグラウンド再生の最適化

- **提案**: バックグラウンド再生時のリソース使用を最適化
- **実装方法**:
  - AppKilledPlaybackBehavior の適切な設定
  - バックグラウンド時の不要な処理の停止
  - ロック画面コントロールの最適化

```typescript
// 改善例: 最適化されたバックグラウンド設定
await TrackPlayer.updateOptions({
  android: {
    appKilledPlaybackBehavior:
      AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
  },
  capabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SeekTo,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
  ],
  compactCapabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SkipToNext,
  ],
  notificationCapabilities: [
    Capability.Play,
    Capability.Pause,
    Capability.SeekTo,
    Capability.SkipToNext,
    Capability.SkipToPrevious,
  ],
  // ロック画面表示の問題を修正
  alwaysPauseOnInterruption: true,
});
```

#### メモリリークの防止

- **提案**: メモリリークを防止し、長時間使用時のパフォーマンス低下を防ぐ
- **実装方法**:
  - useRef を使用したリソース参照の適切な管理
  - コンポーネントのアンマウント時のクリーンアップの徹底
  - 大きなオブジェクトや配列の不要な再作成の防止

```typescript
// 改善例: メモリリーク防止のためのユーティリティ関数
export const useSafeAsyncEffect = (effect, deps = []) => {
  useEffect(() => {
    const isMounted = { current: true };
    const runEffect = async () => {
      try {
        await effect(isMounted);
      } catch (error) {
        if (isMounted.current) {
          console.error("Async effect error:", error);
        }
      }
    };

    runEffect();

    return () => {
      isMounted.current = false;
    };
  }, deps);
};
```

## 実装優先度

1. **高優先度**

   - メモリリークの修正とリソース解放の改善
   - バックグラウンド再生の最適化（ロック画面表示問題の解決）
   - 画像処理の最適化

2. **中優先度**

   - React Query のキャッシュ戦略の最適化
   - コンポーネントの再レンダリング最適化
   - Zustand ストアの設計改善

3. **低優先度**
   - アニメーションとジェスチャー処理の最適化
   - オーディオエンジンの統一または明確な分離
   - パフォーマンス測定と監視の導入

## まとめ

この最適化レポートでは、音楽アプリの主要なパフォーマンス問題を特定し、具体的な改善策を提案しました。特に重要なのは、メモリ管理とリソース解放の改善、バックグラウンド再生の最適化、そして画像処理とレンダリングパフォーマンスの向上です。これらの改善を実装することで、アプリの応答性、安定性、およびユーザーエクスペリエンスが大幅に向上することが期待されます。
