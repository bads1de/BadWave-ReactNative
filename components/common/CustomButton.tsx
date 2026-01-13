import React, { memo } from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
} from "react-native";

interface CustomButtonProps extends TouchableOpacityProps {
  label: string;
  isActive: boolean;
  activeStyle?: any;
  inactiveStyle?: any;
  activeTextStyle?: any;
  inactiveTextStyle?: any;
  testID?: string;
}

/**
 * アクティブ/非アクティブの状態でスタイルが変化する、カスタマイズ可能なボタンコンポーネントです。
 *
 * @param {CustomButtonProps} props - コンポーネントのプロパティ。`TouchableOpacityProps` を拡張します。
 * @param {string} props.label - ボタンに表示されるテキスト。
 * @param {boolean} props.isActive - ボタンがアクティブ状態かどうか。
 * @param {object} [props.activeStyle] - アクティブ状態の時のボタンスタイル。
 * @param {object} [props.inactiveStyle] - 非アクティブ状態の時のボタンスタイル。
 * @param {object} [props.activeTextStyle] - アクティブ状態の時のテキストスタイル。
 * @param {object} [props.inactiveTextStyle] - 非アクティブ状態の時のテキストスタイル。
 * @param {string} [props.testID] - テスト用のID。
 * @returns {JSX.Element} カスタムボタンコンポーネント。
 */
function CustomButton({
  label,
  isActive,
  activeStyle,
  inactiveStyle,
  activeTextStyle,
  inactiveTextStyle,
  ...props
}: CustomButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isActive ? activeStyle : inactiveStyle]}
      {...props}
    >
      <Text
        style={[
          styles.buttonText,
          isActive ? activeTextStyle : inactiveTextStyle,
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "600",
  },
});

// メモ化してエクスポート
export default memo(CustomButton, (prevProps, nextProps) => {
  // 主要なpropsを比較
  return (
    prevProps.label === nextProps.label &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.activeStyle === nextProps.activeStyle &&
    prevProps.inactiveStyle === nextProps.inactiveStyle &&
    prevProps.activeTextStyle === nextProps.activeTextStyle &&
    prevProps.inactiveTextStyle === nextProps.inactiveTextStyle &&
    prevProps.testID === nextProps.testID &&
    prevProps.onPress === nextProps.onPress // onPressも比較対象に追加
  );
});

