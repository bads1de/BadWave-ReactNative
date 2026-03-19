import { memo } from "react";
import { TouchableOpacity, Alert } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useLikeStatus } from "@/hooks/data/useLikeStatus";
import { useLikeMutation } from "@/hooks/mutations/useLikeMutation";

interface LikeButtonProps {
  songId: string;
  size?: number;
  testID?: string;
}

/**
 * @file LikeButton.tsx
 * @description 曲に対する「いいね」機能を提供するボタンコンポーネントです。
 *
 * ローカルファースト設計:
 * - いいね状態は useLikeStatus (SQLite) から取得
 * - いいね操作は useLikeMutation (SQLite + Supabase) で実行
 *
 * @component
 * @param {LikeButtonProps} props - コンポーネントのプロパティ
 * @param {string} props.songId - いいね対象の曲ID
 * @param {number} [props.size=24] - アイコンのサイズ
 * @param {string} [props.testID] - テスト用ID
 * @returns {JSX.Element} いいねボタン
 */
function LikeButton({ songId, size = 24, testID }: LikeButtonProps) {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const userId = session?.user.id;

  // ローカルファースト: SQLite からいいね状態を取得
  const { isLiked, isLoading } = useLikeStatus(songId, userId);

  // ローカルファースト: SQLite + Supabase に書き込み
  const { mutate, isPending } = useLikeMutation(songId, userId);

  // オフライン時またはミューテーション中は無効化
  const isDisabled = isPending || !isOnline || isLoading;

  const handlePress = () => {
    // オフライン時はアラート表示
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "いいね機能にはインターネット接続が必要です",
        [{ text: "OK" }]
      );
      return;
    }

    // 未ログイン時はToast表示
    if (!session) {
      Toast.show({
        type: "info",
        text1: "ログインが必要です",
        text2: "いいね機能を使うにはログインしてください",
      });
      return;
    }

    // ミューテーション中は何もしない
    if (isPending) {
      return;
    }

    // いいね操作を実行（現在の状態を渡す）
    mutate(isLiked);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      testID={testID}
    >
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={size}
        color={isLiked ? "#FF69B4" : "white"}
        style={{ opacity: isDisabled ? 0.4 : 1 }}
      />
    </TouchableOpacity>
  );
}

// カスタム比較関数を使用してメモ化
export default memo(LikeButton, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.size === nextProps.size &&
    prevProps.testID === nextProps.testID
  );
});

