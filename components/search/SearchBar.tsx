import React, { useState, useEffect, useCallback } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Search as SearchIcon, CircleX } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useDebounce } from "@/hooks/common/useDebounce";
import { FONTS } from "@/constants/theme";

interface SearchBarProps {
  initialValue?: string;
  onDebouncedChange: (value: string) => void;
  externalQuery?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({
  initialValue = "",
  onDebouncedChange,
  externalQuery,
  onFocus,
  onBlur,
}: SearchBarProps) {
  const [localQuery, setLocalQuery] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const debouncedValue = useDebounce(localQuery, 500);
  const colors = useThemeStore((state) => state.colors);

  // 通知する
  useEffect(() => {
    onDebouncedChange(debouncedValue);
  }, [debouncedValue, onDebouncedChange]);

  // 外部からの強制更新 (履歴選択時など)
  useEffect(() => {
    if (externalQuery !== undefined && externalQuery !== localQuery) {
      setLocalQuery(externalQuery);
    }
  }, [externalQuery]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleClear = useCallback(() => {
    setLocalQuery("");
  }, []);

  return (
    <View
      style={[
        styles.searchInputContainer,
        isFocused
          ? [
              styles.searchInputFocused,
              { borderColor: colors.primary, shadowColor: colors.primary },
            ]
          : styles.searchInputNormal,
      ]}
    >
      <SearchIcon
        size={20}
        color={isFocused ? colors.primary : colors.subText}
        style={styles.searchIcon}
      />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search songs or playlists..."
        placeholderTextColor={colors.subText}
        value={localQuery}
        onChangeText={setLocalQuery}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      {localQuery.length > 0 && (
        <TouchableOpacity onPress={handleClear} activeOpacity={0.7}>
          <CircleX size={20} color={colors.subText} style={styles.clearIcon} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28,
    paddingHorizontal: 20,
    height: 56,
    marginBottom: 24,
    borderWidth: 1,
  },
  searchInputFocused: {
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  searchInputNormal: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
  },
  searchIcon: {
    marginRight: 12,
  },
  clearIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    fontFamily: FONTS.body,
  },
});
