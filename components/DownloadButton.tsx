import React, { useCallback, memo } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import {
  useDownloadStatus,
  useDownloadSong,
  useDeleteDownloadedSong,
} from "@/hooks/useDownloadStatus";

interface DownloadButtonProps {
  song: Song;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * 曲のダウンロード/削除ボタンコンポーネント
 * 曲がダウンロード済みかどうかによって表示を切り替える
 */
function DownloadButtonComponent({
  song,
  size = 24,
  color = "white",
  style = {},
}: DownloadButtonProps) {
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
    downloadMutation.mutate(song);
  }, [downloadMutation, song]);

  // 削除処理
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
  return (
    <TouchableOpacity
      testID="download-button"
      onPress={handleDownload}
      style={[styles.button, style]}
    >
      <Ionicons name="cloud-download-outline" size={size} color={color} />
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
