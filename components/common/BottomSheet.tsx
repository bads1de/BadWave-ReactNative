import React, { useEffect } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { ANIMATION_DURATION, SPRING_CONFIG } from "@/constants";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * 開閉アニメーションの詳細設定。
 * 省略時は PlaylistOptionsMenu 相当のデフォルト値が使われる。
 */
export interface BottomSheetAnimationConfig {
  /** 開くときの overlay opacity の duration */
  openOpacityDuration?: number;
  /** 閉じるときの overlay opacity の duration */
  closeOpacityDuration?: number;
  /** 閉じるときの translateY の duration */
  closeTranslateDuration?: number;
  /** 開くときの translateY をスプリングで行うか（false なら withTiming） */
  openWithSpring?: boolean;
}

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  /** シート下部の閉じるボタン等を配置するスロット */
  footer?: React.ReactNode;
  /** シートの paddingBottom（safeAreaBottom 指定時は無視される） */
  paddingBottom?: number;
  maxHeight?: number;
  /** シートの追加スタイル（padding / shadow 等） */
  sheetStyle?: StyleProp<ViewStyle>;
  /** ハンドルの追加スタイル */
  handleStyle?: StyleProp<ViewStyle>;
  /** overlay の背景色（デフォルト: rgba(0,0,0,0.6)） */
  overlayColor?: string;
  /** シート本体の testID */
  testID?: string;
  /** 最外殻（modalRoot）の testID */
  rootTestID?: string;
  /** overlay の testID */
  overlayTestID?: string;
  /**
   * false の場合は Reanimated を使わず、Modal のネイティブアニメーション
   * （animationType）に任せる。
   */
  animated?: boolean;
  /** animated=false のときの Modal animationType（デフォルト: "slide"） */
  animationType?: "none" | "slide" | "fade";
  statusBarTranslucent?: boolean;
  /**
   * Modal サブツリー内に SafeAreaProvider を置く。
   * Android の Modal 内ではルートの inset が取得できないため。
   */
  insetProvider?: boolean;
  /** シート下部へ「セーフエリア下端 + extra」のパディングを自動適用する */
  safeAreaBottom?: boolean;
  /** safeAreaBottom の最小値（デフォルト: Android 24 / それ以外 20） */
  safeAreaMinInset?: number;
  /** safeAreaBottom の追加余白（デフォルト: 20） */
  safeAreaExtraInset?: number;
  /** 開閉アニメーションの詳細（animated=true のとき有効） */
  animation?: BottomSheetAnimationConfig;
}

/**
 * ボトムシートの共通スキャフォールド。
 *
 * modalRoot / overlay / sheet / handle / 閉じるボタン(footer) と、
 * translateY・opacity の開閉アニメーションを一元化する。
 * ItemOptionsMenu / AddPlaylist / CreatePlaylist / PlaylistOptionsMenu で
 * 重複していた実装を共通化した。
 */
function BottomSheetSheet({
  visible,
  onClose,
  children,
  footer,
  paddingBottom,
  maxHeight,
  sheetStyle,
  handleStyle,
  overlayColor = "rgba(0,0,0,0.6)",
  testID,
  rootTestID,
  overlayTestID,
  animated = true,
  safeAreaBottom = false,
  safeAreaMinInset,
  safeAreaExtraInset = 20,
  animation,
}: BottomSheetProps) {
  const colors = useThemeStore((state) => state.colors);
  const insets = useSafeAreaInsets();

  const {
    openOpacityDuration = ANIMATION_DURATION.medium,
    closeOpacityDuration = 250,
    closeTranslateDuration = ANIMATION_DURATION.medium,
    openWithSpring = true,
  } = animation ?? {};

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!animated) {
      return;
    }

    if (visible) {
      opacity.value = withTiming(1, { duration: openOpacityDuration });
      translateY.value = openWithSpring
        ? withSpring(0, SPRING_CONFIG.smooth)
        : withTiming(0, { duration: closeTranslateDuration });
    } else {
      opacity.value = withTiming(0, { duration: closeOpacityDuration });
      translateY.value = withTiming(SCREEN_HEIGHT, {
        duration: closeTranslateDuration,
      });
    }
  }, [
    visible,
    animated,
    opacity,
    translateY,
    openOpacityDuration,
    closeOpacityDuration,
    closeTranslateDuration,
    openWithSpring,
  ]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const resolvedPaddingBottom = safeAreaBottom
    ? Math.max(
        insets.bottom,
        safeAreaMinInset ?? (Platform.OS === "android" ? 24 : 20),
      ) + safeAreaExtraInset
    : paddingBottom;

  const sheetStyleArray = [
    styles.sheet,
    { backgroundColor: colors.background, borderColor: colors.border },
    maxHeight != null ? { maxHeight } : null,
    resolvedPaddingBottom != null
      ? { paddingBottom: resolvedPaddingBottom }
      : null,
    sheetStyle,
  ];

  const content = (
    <>
      <View style={[styles.handle, handleStyle]} />
      {children}
      {footer}
    </>
  );

  return (
    <View style={styles.modalRoot} testID={rootTestID}>
      {animated ? (
        <Animated.View
          style={[
            styles.overlay,
            { backgroundColor: overlayColor },
            overlayAnimatedStyle,
          ]}
          testID={overlayTestID}
        >
          <Pressable style={styles.flex} onPress={onClose} />
        </Animated.View>
      ) : (
        <View
          style={[styles.overlay, { backgroundColor: overlayColor }]}
          testID={overlayTestID}
        >
          <Pressable style={styles.flex} onPress={onClose} />
        </View>
      )}

      {animated ? (
        <Animated.View
          style={[sheetStyleArray, sheetAnimatedStyle]}
          testID={testID}
        >
          {content}
        </Animated.View>
      ) : (
        <View style={sheetStyleArray} testID={testID}>
          {content}
        </View>
      )}
    </View>
  );
}

export function BottomSheet(props: BottomSheetProps) {
  const { visible, onClose, insetProvider, statusBarTranslucent, animated } =
    props;

  return (
    <Modal
      visible={visible}
      transparent
      animationType={animated === false ? (props.animationType ?? "slide") : "none"}
      statusBarTranslucent={statusBarTranslucent}
      onRequestClose={onClose}
    >
      {insetProvider ? (
        <SafeAreaProvider style={styles.flex}>
          <BottomSheetSheet {...props} />
        </SafeAreaProvider>
      ) : (
        <BottomSheetSheet {...props} />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
});

export default BottomSheet;
