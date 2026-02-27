import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Palette, RefreshCw, HardDrive, LogOut } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { BlurView } from "expo-blur";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/actions/user/getUser";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { THEMES, ThemeType } from "@/constants/ThemeColors";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { useSync } from "@/providers/SyncProvider";
import { useStorageInfo, formatBytes } from "@/hooks/common/useStorageInfo";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { SettingSection } from "@/components/common/SettingSection";
import { SettingItem } from "@/components/common/SettingItem";
import { FONTS } from "@/constants/theme";

/**
 * @file (tabs)/account.tsx
 * @description アカウントページ
 *
 * デスクトップ版のテーマカラーをサポートしたモダンなアカウント設定画面。
 * テーマ切り替え機能を含みます。
 */
export default function AccountScreen() {
  const router = useRouter();
  const { data: user } = useUser();
  const userId = user?.id;
  const { colors, currentTheme, setTheme } = useThemeStore();

  // 実データの取得
  const { playlists } = useGetPlaylists(userId);
  const { likedSongs } = useGetLikedSongs(userId);
  const { isSyncing, lastSyncTime, triggerSync } = useSync();
  const {
    downloadedSize,
    downloadedCount,
    isLoading: isStorageLoading,
    deleteAllDownloads,
    clearQueryCache,
  } = useStorageInfo();

  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* 背景グラデーション (動的) */}
      <LinearGradient
        colors={colors.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          testID="back-button"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Account
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* プロフィールセクション */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <ExpoImage
              source={{
                uri: user?.avatar_url || "https://via.placeholder.com/150",
              }}
              style={[styles.avatar, { borderColor: colors.text }]}
              contentFit="cover"
              transition={200}
            />
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.full_name || "Guest User"}
          </Text>

          {/* 統計情報 */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {playlists.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>
                Playlists
              </Text>
            </View>
            <View
              style={[styles.statDivider, { backgroundColor: colors.border }]}
            />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {likedSongs.length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.subText }]}>
                Liked
              </Text>
            </View>
          </View>
        </View>

        {/* テーマ切り替えセクション */}
        <SettingSection title="Appearance" icon={Palette}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.themeSelector}
          >
            {(Object.keys(THEMES) as ThemeType[]).map((themeKey) => (
              <TouchableOpacity
                key={themeKey}
                style={[
                  styles.themeOption,
                  currentTheme === themeKey && {
                    borderColor: colors.accentFrom,
                    borderWidth: 2,
                  },
                ]}
                onPress={() => setTheme(themeKey)}
              >
                <LinearGradient
                  colors={THEMES[themeKey].colors.accentGradient}
                  style={styles.themePreview}
                />
                <Text
                  style={[
                    styles.themeLabel,
                    {
                      color:
                        currentTheme === themeKey
                          ? colors.text
                          : colors.subText,
                    },
                  ]}
                >
                  {THEMES[themeKey].label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </SettingSection>

        {/* 同期セクション */}
        <SettingSection title="Synchronization" icon={RefreshCw}>
          <SettingItem
            icon="sync-outline"
            title="Sync Database"
            description={
              isSyncing
                ? "Syncing now..."
                : lastSyncTime
                  ? `Last: ${lastSyncTime.toLocaleString()}`
                  : "Never synced"
            }
            isLast
            rightElement={
              <TouchableOpacity
                style={[
                  styles.smallButton,
                  { backgroundColor: colors.accentFrom },
                  isSyncing && { opacity: 0.6 },
                ]}
                onPress={triggerSync}
                disabled={isSyncing}
                activeOpacity={0.7}
              >
                {isSyncing ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.smallButtonText}>Sync</Text>
                )}
              </TouchableOpacity>
            }
          />
        </SettingSection>

        {/* ストレージセクション */}
        <SettingSection title="Storage" icon={HardDrive}>
          <SettingItem
            icon="download-outline"
            title="Downloads"
            description={
              isStorageLoading
                ? "Loading..."
                : `${downloadedCount} songs • ${formatBytes(downloadedSize)}`
            }
            rightElement={
              <TouchableOpacity
                style={[
                  styles.smallButton,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                  downloadedCount === 0 && { opacity: 0.5 },
                ]}
                onPress={() => setIsDeleteModalVisible(true)}
                disabled={downloadedCount === 0}
                activeOpacity={0.7}
                testID="delete-all-downloads-button"
              >
                <Text style={[styles.smallButtonText, { color: "#EF4444" }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            }
            onPress={() => setIsDeleteModalVisible(true)}
            disabled={downloadedCount === 0}
          />
          <SettingItem
            icon="trash-outline"
            title="Clear Cache"
            description="Clear cached query data"
            isLast
            rightElement={
              <TouchableOpacity
                style={[
                  styles.smallButton,
                  { backgroundColor: colors.accentFrom + "20" },
                ]}
                onPress={clearQueryCache}
                activeOpacity={0.7}
                testID="clear-cache-button"
              >
                <Text
                  style={[styles.smallButtonText, { color: colors.accentFrom }]}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            }
            onPress={clearQueryCache}
          />
        </SettingSection>

        {/* ログアウト */}
        <SettingSection title="System" icon={LogOut}>
          <SettingItem
            icon="log-out-outline"
            title="Log Out"
            destructive
            onPress={handleLogout}
            isLast
          />
        </SettingSection>

        <Text style={[styles.versionText, { color: colors.subText }]}>
          Version 1.0.0
        </Text>
      </ScrollView>

      <ConfirmModal
        visible={isDeleteModalVisible}
        title="Delete Downloads?"
        description={`Are you sure you want to delete all ${downloadedCount} downloaded songs? This action cannot be undone.`}
        confirmLabel="Delete All"
        cancelLabel="Keep Songs"
        icon="trash"
        isDestructive={true}
        onConfirm={async () => {
          setIsDeleteModalVisible(false);
          await deleteAllDownloads();
        }}
        onCancel={() => setIsDeleteModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 30,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
  },
  userName: {
    fontSize: 28,
    fontFamily: FONTS.title,
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 40,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontFamily: FONTS.bold,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  themeSelector: {
    padding: 16,
    gap: 12,
  },
  themeOption: {
    alignItems: "center",
    marginRight: 12,
    borderRadius: 12,
    padding: 4,
  },
  themePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginBottom: 8,
  },
  themeLabel: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
    fontFamily: FONTS.body,
  },
  smallButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  smallButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
});
