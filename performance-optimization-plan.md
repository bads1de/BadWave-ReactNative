# BadMusicApp パフォーマンス最適化計画

## 現状分析

BadMusicApp のコードベースを分析した結果、以下の領域でパフォーマンス最適化の余地があることが判明しました。

### 1. レンダリングパフォーマンス

- **メモ化の活用**: 多くのコンポーネントで `React.memo` が適用されていますが、一部のコンポーネントでは最適化の余地があります
- **リスト表示の最適化**: FlatList の設定は適切ですが、さらなる最適化が可能です
- **コンポーネント分割**: 一部の大きなコンポーネントは、さらに小さなコンポーネントに分割できる可能性があります

### 2. 画像処理とリソース管理

- **画像キャッシュ戦略**: 現在 `expo-image` を使用していますが、キャッシュポリシーの統一と最適化が必要です
- **画像サイズと品質**: 画像のサイズと品質の最適化が必要です
- **遅延読み込み**: 画面外の画像の読み込みを遅延させる戦略が不足しています

### 3. データ管理とキャッシュ

- **TanStack Query**: キャッシュ戦略は適切ですが、さらなる最適化が可能です
- **MMKV 統合**: AsyncStorage から MMKV への移行が一部完了していますが、さらなる統合が必要です
- **オフラインサポート**: オフライン機能は実装されていますが、最適化の余地があります

### 4. ネットワーク最適化

- **データフェッチング**: 一部の API リクエストで不必要なデータを取得している可能性があります
- **バッチ処理**: 複数の小さなリクエストをバッチ処理できる可能性があります
- **プリフェッチ戦略**: ユーザー行動の予測に基づくプリフェッチが不足しています

## 最適化計画

### 1. レンダリングパフォーマンス最適化

#### 1.1 メモ化の強化

```typescript
// 現在のメモ化
export default memo(Component);

// 改善案: カスタム比較関数の追加
export default memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id && prevProps.status === nextProps.status;
});
```

#### 1.2 useMemo と useCallback の戦略的活用

```typescript
// 改善案: 複雑な計算の最適化
const memoizedValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// 改善案: コールバック関数の最適化
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

#### 1.3 FlatList のさらなる最適化

```typescript
<FlatList
  // 既存の最適化
  windowSize={5}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  removeClippedSubviews={true}
  initialNumToRender={8}
  // 追加の最適化
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
  }}
  // 必要に応じてキャッシュを制限
  maxToRenderPerBatch={5}
  onEndReachedThreshold={0.5}
/>
```

#### 1.4 コンポーネント分割の最適化

- `Player.tsx`の分割: 現在のコンポーネントをさらに小さな機能単位に分割
- `PlayerContainer.tsx`の最適化: 状態管理と UI の分離を強化

### 2. 画像処理とリソース管理の最適化

#### 2.1 画像キャッシュポリシーの統一

```typescript
// 現在の実装（バラバラ）
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
/>

<Image
  source={{ uri: anotherImageUrl }}
  cachePolicy="disk"
/>

// 改善案: キャッシュポリシーの統一と最適化
<Image
  source={{ uri: imageUrl }}
  cachePolicy="memory-disk"
  transition={200}
  priority={isVisible ? "high" : "low"}
/>
```

#### 2.2 画像サイズと品質の最適化

- CDN またはサーバーサイドでの画像リサイズの実装
- 画面サイズに応じた適切な画像サイズの選択
- WebP などの効率的なフォーマットの採用検討

#### 2.3 画像の遅延読み込みとプリロード

```typescript
// 改善案: 重要な画像のプリロード
useEffect(() => {
  if (currentSong) {
    Image.prefetch(currentSong.image_path);
    // 次の曲の画像もプリロード
    if (nextSong) {
      Image.prefetch(nextSong.image_path);
    }
  }
}, [currentSong, nextSong]);
```

### 3. データ管理とキャッシュの最適化

#### 3.1 TanStack Query の最適化

```typescript
// 現在の設定
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.staleTime, // 10分
      gcTime: CACHE_CONFIG.gcTime, // 30分
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

// 改善案: クエリごとに最適なキャッシュ戦略を設定
const { data } = useQuery({
  queryKey: [CACHED_QUERIES.songs],
  queryFn: getSongs,
  staleTime: 1000 * 60 * 30, // 30分（頻繁に変更されないデータ）
});

const { data } = useQuery({
  queryKey: [CACHED_QUERIES.userProfile],
  queryFn: getUserProfile,
  staleTime: 1000 * 60 * 5, // 5分（比較的頻繁に変更されるデータ）
});
```

#### 3.2 MMKV への完全移行

```typescript
// lib/supabase.ts の改善案
import { storage } from "./mmkv-storage";

// AsyncStorageからMMKVへの移行
const mmkvStorage = {
  getItem: async (key: string) => {
    const value = storage.getString(key);
    return value === undefined ? null : value;
  },
  setItem: async (key: string, value: string) => {
    storage.set(key, value);
    return;
  },
  removeItem: async (key: string) => {
    storage.delete(key);
    return;
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: mmkvStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
```

#### 3.3 オフラインサポートの強化

- オフラインモード検出の改善
- オフラインデータの同期戦略の最適化
- オフラインでのユーザーエクスペリエンスの向上

### 4. ネットワーク最適化

#### 4.1 API リクエストの最適化

```typescript
// 現在の実装
const { data } = await supabase
  .from("songs")
  .select("*") // すべてのフィールドを取得
  .eq("id", songId);

// 改善案: 必要なフィールドのみを取得
const { data } = await supabase
  .from("songs")
  .select("id, title, author, image_path, song_path") // 必要なフィールドのみ
  .eq("id", songId);
```

#### 4.2 バッチ処理の実装

- 複数の小さなリクエストを一つの大きなリクエストにまとめる
- 一括更新処理の実装

#### 4.3 プリフェッチ戦略の実装

```typescript
// 改善案: ユーザー行動に基づくプリフェッチ
useEffect(() => {
  // ユーザーがプレイリストを開いたら、そのプレイリストの曲をプリフェッチ
  if (isPlaylistOpen) {
    queryClient.prefetchQuery({
      queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      queryFn: () => getPlaylistSongs(playlistId),
    });
  }
}, [isPlaylistOpen, playlistId]);
```

## 実装優先順位

1. **高優先度**

   - MMKV への完全移行（AsyncStorage からの移行完了）
   - 画像キャッシュ戦略の統一と最適化
   - FlatList のさらなる最適化

2. **中優先度**

   - メモ化の強化と useMemo/useCallback の戦略的活用
   - API リクエストの最適化
   - 画像の遅延読み込みとプリロード

3. **低優先度**
   - コンポーネント分割の最適化
   - バッチ処理の実装
   - プリフェッチ戦略の実装

## パフォーマンス測定計画

1. **ベースライン測定**

   - React DevTools の Profier を使用したレンダリング時間の測定
   - メモリ使用量の測定（React Native Performance Monitor を使用）
   - ネットワークリクエストの数と時間の測定（Flipper を使用）
   - 起動時間の測定（cold start、warm start）
   - FPS の測定（特にアニメーション中やスクロール中）

2. **最適化後の測定**

   - 同じシナリオでの測定を繰り返し、改善を確認
   - ユーザー体験の向上を定性的に評価
   - 以下のシナリオでのパフォーマンス比較：
     - アプリ起動時間
     - 曲リストのスクロール（100 曲以上）
     - プレイヤー表示/非表示の切り替え
     - 曲の再生開始時間
     - 画像読み込み時間

3. **継続的なモニタリング**
   - パフォーマンスリグレッションを防ぐための継続的な測定
   - 新機能追加時のパフォーマンス影響評価
   - 自動化されたパフォーマンステストの導入検討

## まとめ

BadMusicApp のパフォーマンスを最適化するための包括的な計画を提案しました。これらの最適化を実装することで、アプリの応答性、リソース使用効率、およびユーザーエクスペリエンスが大幅に向上することが期待されます。優先順位に従って段階的に実装し、各ステップでパフォーマンスを測定することで、最大の効果を得ることができます。

また、コードベース全体の分析から、以下の追加的な最適化ポイントも検討すべきです：

1. **ルーティングとナビゲーションの最適化**

   - Expo Router のパフォーマンス最適化
   - スクリーン間の遷移を最適化

2. **テストカバレッジの向上**

   - パフォーマンステストの導入
   - 自動化されたパフォーマンスベンチマーク

3. **バンドルサイズの最適化**
   - 依存関係の見直しと不要なパッケージの削除
   - コード分割と遅延読み込みの導入

これらの追加的な最適化を実装することで、さらなるパフォーマンスの向上が期待できます。
