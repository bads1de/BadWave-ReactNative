import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";
import { LucideIcon } from "lucide-react-native";

export interface TabOption<T> {
  label: string;
  value: T;
  icon?: LucideIcon;
}

interface TabSwitcherProps<T> {
  options: TabOption<T>[];
  value: T;
  onValueChange: (value: T) => void;
  containerStyle?: ViewStyle;
}

function TabSwitcherInner<T extends string>({
  options,
  value,
  onValueChange,
  containerStyle,
}: TabSwitcherProps<T>) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <View style={[styles.tabContainer, containerStyle]}>
      {options.map((option) => {
        const isActive = value === option.value;
        const Icon = option.icon;

        return (
          <TouchableOpacity
            key={option.value}
            onPress={() => onValueChange(option.value)}
            style={[
              styles.tabItem,
              isActive && {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
            activeOpacity={0.8}
          >
            {Icon && (
              <Icon
                size={16}
                color={isActive ? colors.background : colors.subText}
                // 特定の条件（Favoritesなど）で塗りつぶしが必要な場合のロジック
                {...(isActive && option.label === "Favorites" ? { fill: colors.background } : {})}
              />
            )}
            <Text
              style={[
                styles.tabText,
                {
                  color: isActive ? colors.background : colors.subText,
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export const TabSwitcher = memo(TabSwitcherInner);

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
  },
});
