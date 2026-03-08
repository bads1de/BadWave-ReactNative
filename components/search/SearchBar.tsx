import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Search as SearchIcon, CircleX } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useDebounce } from "@/hooks/common/useDebounce";
import { FONTS } from "@/constants/theme";

interface SearchBarProps {
  /** デバウンス後（300ms）の値が変わったときに呼ばれる */
  onDebouncedChange: (value: string) => void;
  /** キー入力のたびに即時呼ばれる（履歴の表示制御用） */
  onInputChange?: (value: string) => void;
  /** キーボードの Search ボタンを押したときに呼ばれる（履歴追加のタイミング制御用） */
  onSubmit?: () => void;
  /** 外部から入力値を強制設定する（履歴選択時など）。変更時のみ反応する。 */
  controlledValue?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

function SearchBarInner({
  onDebouncedChange,
  onInputChange,
  onSubmit,
  controlledValue,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const [value, setValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebounce(value, 300);
  const colors = useThemeStore((state) => state.colors);
  // 初回マウント時は onDebouncedChange を呼ばないための ref
  const isFirstRender = useRef(true);

  // デバウンス後に親へ通知（初回マウント時はスキップ）
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onDebouncedChange(debouncedValue);
  }, [debouncedValue, onDebouncedChange]);

  // 外部からの強制更新（履歴選択時など）
  useEffect(() => {
    if (controlledValue !== undefined && controlledValue !== value) {
      setValue(controlledValue);
    }
    // controlledValue が変わった時だけ実行
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [controlledValue]);

  const handleChange = useCallback(
    (text: string) => {
      setValue(text);
      onInputChange?.(text);
    },
    [onInputChange],
  );

  const handleClear = useCallback(() => {
    setValue("");
    onInputChange?.("");
    onDebouncedChange(""); // クリアは即時に検索もリセット
  }, [onInputChange, onDebouncedChange]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  return (
    <View
      style={[
        styles.container,
        isFocused
          ? {
              ...styles.focused,
              borderColor: colors.primary,
              shadowColor: colors.primary,
            }
          : styles.normal,
      ]}
    >
      <SearchIcon
        size={20}
        color={isFocused ? colors.primary : colors.subText}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder="Search songs or playlists..."
        placeholderTextColor={colors.subText}
        value={value}
        onChangeText={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
          <CircleX size={20} color={colors.subText} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

export const SearchBar = memo(SearchBarInner);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 56,
    marginBottom: 24,
    borderWidth: 1,
  },
  focused: {
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  normal: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
  },
  icon: {
    marginRight: 12,
  },
  clearIcon: {
    marginLeft: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    fontFamily: FONTS.body,
  },
});
