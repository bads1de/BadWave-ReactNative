# TODO: 同期処理の改善

## 📋 現状の問題

現在の同期処理は**毎回全データを取得して同期**しています。

### 各同期フックの動作

| フック              | 同期方式            | 問題点                        |
| ------------------- | ------------------- | ----------------------------- |
| `useSyncSongs`      | 全件取得 + Upsert   | 全楽曲を取得し、1 曲ずつ処理  |
| `useSyncLikedSongs` | 全件削除 + 全件挿入 | 毎回削除 → 再挿入             |
| `useSyncPlaylists`  | 全件取得 + Upsert   | プレイリスト曲は削除 → 再挿入 |

### スケール問題

- **数千曲**: 問題なし
- **数万曲**: 同期に数十秒かかる可能性
- **数百万曲以上**: メモリ枯渇、タイムアウトの危険

---

## ✅ 改善案: 差分同期（Incremental Sync）

### 1. 最終同期時刻の管理

```typescript
// sectionCache テーブルを活用、または専用テーブル作成
const getLastSyncTime = async (key: string): Promise<Date | null> => {
  const result = await db
    .select()
    .from(sectionCache)
    .where(eq(sectionCache.key, `sync_${key}`));
  return result[0]?.updatedAt ?? null;
};

const setLastSyncTime = async (key: string) => {
  await db
    .insert(sectionCache)
    .values({ key: `sync_${key}`, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: sectionCache.key,
      set: { updatedAt: new Date() },
    });
};
```

### 2. 差分取得

```typescript
// useSyncSongs.ts の改善案
const lastSyncTime = await getLastSyncTime("songs");

const { data: remoteSongs } = await supabase
  .from("songs")
  .select("*")
  .gt("updated_at", lastSyncTime ?? "1970-01-01") // 差分のみ
  .order("updated_at", { ascending: true })
  .limit(500); // ページング

// 同期完了後
await setLastSyncTime("songs");
```

### 3. Supabase 側の準備

- `songs` テーブルに `updated_at` カラムが必要
- トリガーで自動更新するか、アプリ側で設定

```sql
-- Supabase マイグレーション
ALTER TABLE songs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER songs_updated_at
BEFORE UPDATE ON songs
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 4. 削除の同期

差分同期では削除されたレコードの検出が課題:

- **ソフトデリート**: `deleted_at` カラムを追加
- **変更ログテーブル**: `sync_log` テーブルで変更を追跡

---

## 🔧 実装優先度

| 項目                         | 優先度 | 理由                           |
| ---------------------------- | ------ | ------------------------------ |
| `useSyncSongs` の差分化      | 高     | 最もデータ量が多い             |
| バッチ処理の導入             | 高     | 1 件ずつの処理を改善           |
| インデックス追加             | 中     | クエリ高速化                   |
| `useSyncLikedSongs` の差分化 | 中     | ユーザーデータなので比較的少量 |
| `useSyncPlaylists` の差分化  | 低     | プレイリスト数は少ない         |

---

## 📝 備考

- 現状の全件同期は **楽曲数が数千件程度** なら問題なく動作
- 大規模化が見込まれる場合は早めに差分同期を実装すべき
- Supabase の `updated_at` カラムとトリガーの設定が前提条件
