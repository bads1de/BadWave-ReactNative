import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import CustomButton from "@/components/common/CustomButton";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

interface LibraryAuthPromptProps {
  onSignIn: () => void;
}

function LibraryAuthPromptInner({ onSignIn }: LibraryAuthPromptProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Animated.View
      entering={FadeIn.duration(800)}
      style={styles.loginContainer}
    >
      <View
        style={[
          styles.loginGlass,
          {
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            borderColor: "rgba(255, 255, 255, 0.05)",
          },
        ]}
      >
        <Text style={[styles.loginMessage, { color: colors.subText }]}>
          Unlock your musical sanctuary. Sign in to access your personal
          collection.
        </Text>
        <CustomButton
          label="Sign In to Badwave"
          isActive
          onPress={onSignIn}
          activeStyle={[
            styles.loginButton,
            { backgroundColor: colors.primary },
          ]}
          activeTextStyle={[
            styles.loginButtonText,
            { color: colors.background },
          ]}
        />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  loginGlass: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    alignItems: "center",
  },
  loginMessage: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 32,
    fontFamily: FONTS.body,
    lineHeight: 26,
  },
  loginButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "100%",
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export const LibraryAuthPrompt = memo(LibraryAuthPromptInner);

