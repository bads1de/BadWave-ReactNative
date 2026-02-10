import React, { memo, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface SearchHistoryProps {
  /** 検索履歴の配列（新しい順） */
  history: string[];
  /** 履歴アイテムをタップした時のコールバック */
  onSelect: (query: string) => void;
  /** 履歴アイテムを削除する時のコールバック */
  onRemove: (query: string) => void;
  /** 全履歴を削除する時のコールバック */
  onClearAll: () => void;
}

/**
 * 検索履歴を表示するコンポーネント
 *
 * - 履歴が空の場合は何も表示しない
 * - チップ形式で履歴を表示
 * - タップで検索を実行
 * - ×ボタンで個別削除
 * - "Clear All" で全削除
 */
function SearchHistoryComponent({
  history,
  onSelect,
  onRemove,
  onClearAll,
}: SearchHistoryProps) {
  const { colors } = useThemeStore();

  const handleSelect = useCallback(
    (query: string) => {
      onSelect(query);
    },
    [onSelect],
  );

  const handleRemove = useCallback(
    (query: string) => {
      onRemove(query);
    },
    [onRemove],
  );

  // 履歴が空の場合は何も表示しない
  if (history.length === 0) {
    return null;
  }

  return (
    <View testID="search-history-container" style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Recent Searches
        </Text>
        <TouchableOpacity
          testID="clear-all-button"
          onPress={onClearAll}
          activeOpacity={0.7}
          style={styles.clearAllButton}
        >
          <Text style={[styles.clearAllText, { color: colors.primary }]}>
            Clear All
          </Text>
        </TouchableOpacity>
      </View>

      {/* 履歴チップ */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
      >
        {history.map((query) => (
          <View
            key={query}
            style={[
              styles.chip,
              {
                backgroundColor: colors.card,
                borderColor: colors.border || "rgba(255,255,255,0.1)",
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => handleSelect(query)}
              activeOpacity={0.7}
              style={styles.chipContent}
            >
              <Ionicons
                name="time-outline"
                size={14}
                color={colors.subText}
                style={styles.chipIcon}
              />
              <Text
                style={[styles.chipText, { color: colors.text }]}
                numberOfLines={1}
              >
                {query}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              testID={`remove-history-${query}`}
              onPress={() => handleRemove(query)}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.removeButton}
            >
              <Ionicons name="close" size={14} color={colors.subText} />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  clearAllButton: {
    padding: 4,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "500",
  },
  chipsContainer: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 8,
    borderWidth: 1,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 180,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  removeButton: {
    marginLeft: 4,
    padding: 4,
    borderRadius: 10,
  },
});

export const SearchHistory = memo(SearchHistoryComponent);
