import React, { useCallback, memo } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import {
  useDownloadStatus,
  useDownloadSong,
  useDeleteDownloadedSong,
} from "@/hooks/useDownloadStatus";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface DownloadButtonProps {
  song: Song;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * 曲のダウンロード状態に応じて、ダウンロードまたは削除の機能を提供するボタンコンポーネントです。
 *
 * - 曲がダウンロード済みの場合：削除アイコンを表示し、タップで端末から曲を削除します。
 * - 曲が未ダウンロードの場合：ダウンロードアイコンを表示し、タップで曲をダウンロードします。
 * - 処理中：ローディングインジケーターを表示します。
 *
 * @param {DownloadButtonProps} props - コンポーネントのプロパティ
 * @param {Song} props.song - 対象の曲オブジェクト
 * @param {number} [props.size=24] - アイコンのサイズ
 * @param {string} [props.color='white'] - アイコンの色
 * @param {object} [props.style={}] - ボタンに適用する追加のスタイル
 * @returns {JSX.Element} ダウンロード/削除ボタン
 */
function DownloadButtonComponent({
  song,
  size = 24,
  color = "white",
  style = {},
}: DownloadButtonProps) {
  // ネットワーク状態を取得
  const { isOnline } = useNetworkStatus();

  // ダウンロード状態を取得
  const { data: isDownloaded = false, isLoading: isStatusLoading } =
    useDownloadStatus(song.id);

  // ダウンロード/削除ミューテーション
  const downloadMutation = useDownloadSong();
  const deleteMutation = useDeleteDownloadedSong();

  // ローディング状態
  const isLoading =
    isStatusLoading ||
    (downloadMutation && downloadMutation.isPending) ||
    (deleteMutation && deleteMutation.isPending);

  // ダウンロード処理
  const handleDownload = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "ダウンロードにはインターネット接続が必要です",
        [{ text: "OK" }]
      );
      return;
    }
    downloadMutation.mutate(song);
  }, [downloadMutation, song, isOnline]);

  // 削除処理（ローカルファイル削除なのでオフラインでも可能）
  const handleDelete = useCallback(() => {
    deleteMutation.mutate(song.id);
  }, [deleteMutation, song.id]);

  // ローディング中
  if (isLoading) {
    return (
      <ActivityIndicator
        testID="loading-indicator"
        size="small"
        color={color}
        style={[styles.button, style]}
      />
    );
  }

  // ダウンロード済み
  if (isDownloaded) {
    return (
      <TouchableOpacity
        testID="delete-button"
        onPress={handleDelete}
        style={[styles.button, style]}
      >
        <Ionicons name="cloud-done" size={size} color={color} />
      </TouchableOpacity>
    );
  }

  // 未ダウンロード
  // オフライン時は無効化
  const isDownloadDisabled = !isOnline;

  return (
    <TouchableOpacity
      testID="download-button"
      onPress={handleDownload}
      style={[styles.button, style]}
      disabled={isDownloadDisabled}
    >
      <Ionicons
        name="cloud-download-outline"
        size={size}
        color={color}
        style={{ opacity: isDownloadDisabled ? 0.4 : 1 }}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});

// propsが変更された場合のみ再レンダリングするようにカスタム比較関数を指定
export const DownloadButton = memo(
  DownloadButtonComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.song.id === nextProps.song.id &&
      prevProps.size === nextProps.size &&
      prevProps.color === nextProps.color &&
      // style prop の比較は複雑になる可能性があるため、ここでは簡易的に参照比較に留めるか、
      // より詳細な比較が必要な場合は適切に実装する必要があります。
      // 例: JSON.stringify(prevProps.style) === JSON.stringify(nextProps.style)
      // ただし、パフォーマンスに影響する可能性もあるため注意が必要です。
      // ここでは、styleが頻繁に変わらないという前提で浅い比較に含めないか、
      // もしくは参照比較のままにします。
      // 今回は主要なpropsのみを比較対象とします。
      Object.is(prevProps.style, nextProps.style)
    );
  }
);
