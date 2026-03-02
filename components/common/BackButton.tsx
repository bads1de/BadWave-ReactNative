import React, { memo } from "react";
import { StyleSheet, TouchableOpacity, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface BackButtonProps {
  /** カスタムの戻り先 (未指定の場合 router.back() を使用) */
  onPress?: () => void;
  /** ボタンのサイズ (デフォルト: 44) */
  size?: number;
  /** BlurView のぼかし強度 (デフォルト: 18) */
  blurIntensity?: number;
  /** 追加スタイル */
  style?: ViewStyle;
  /** テスト ID */
  testID?: string;
  /** アイコン色のオーバーライド (未指定の場合テーマカラー使用) */
  iconColor?: string;
}

/**
 * 統一された戻るボタンコンポーネント
 *
 * アプリ全体で一貫したデザイン:
 * - BlurView によるグラスモーフィズム背景
 * - 角丸正方形 (borderRadius: 14)
 * - テーマカラーに追従するボーダー
 * - ChevronLeft アイコン (lucide-react-native)
 */
function BackButton({
  onPress,
  size = 44,
  blurIntensity = 18,
  style,
  testID = "back-button",
  iconColor,
}: BackButtonProps) {
  const router = useRouter();
  const colors = useThemeStore((state) => state.colors);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  const borderRadius = 14;
  const iconSize = Math.round(size * 0.52);

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.wrapper, { width: size, height: size }, style]}
      activeOpacity={0.75}
      testID={testID}
    >
      <BlurView
        intensity={blurIntensity}
        tint="dark"
        style={[
          styles.blur,
          {
            borderRadius,
            borderColor: colors.primary + "30",
          },
        ]}
      >
        <ChevronLeft
          color={iconColor ?? colors.text}
          size={iconSize}
          strokeWidth={1.5}
        />
      </BlurView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    // TouchableOpacity のヒット領域
  },
  blur: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(10, 10, 10, 0.45)",
  },
});

export default memo(BackButton);
