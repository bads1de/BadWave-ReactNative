import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface SettingItemProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  isLast?: boolean;
  style?: StyleProp<ViewStyle>;
  destructive?: boolean;
  disabled?: boolean;
}

export const SettingItem = ({
  icon,
  title,
  description,
  onPress,
  rightElement,
  isLast = false,
  style,
  destructive = false,
  disabled = false,
}: SettingItemProps) => {
  const { colors } = useThemeStore();

  const Content = (
    <View style={[styles.container, style, disabled && styles.disabled]}>
      {icon && (
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: destructive
                ? "rgba(239, 68, 68, 0.1)"
                : colors.background,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={destructive ? "#EF4444" : colors.text}
          />
        </View>
      )}
      <View style={styles.textContainer}>
        <Text
          style={[
            styles.title,
            { color: destructive ? "#EF4444" : colors.text },
          ]}
        >
          {title}
        </Text>
        {description && (
          <Text style={[styles.description, { color: colors.subText }]}>
            {description}
          </Text>
        )}
      </View>
      {rightElement
        ? rightElement
        : onPress && (
            <Ionicons
              name="chevron-forward"
              size={18}
              color={colors.subText}
              style={{ opacity: 0.5 }}
            />
          )}
    </View>
  );

  const Separator = !isLast && (
    <View style={[styles.separator, { backgroundColor: colors.border }]} />
  );

  if (onPress && !disabled) {
    return (
      <View>
        <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
          {Content}
        </TouchableOpacity>
        {Separator}
      </View>
    );
  }

  return (
    <View>
      {Content}
      {Separator}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
  },
  separator: {
    height: 1,
    marginLeft: 68, // Align with text start (16 padding + 36 icon + 16 margin)
  },
});
