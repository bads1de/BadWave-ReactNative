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
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { supabase } from "@/lib/supabase";
import { useUser } from "@/actions/getUser";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { THEMES, ThemeType } from "@/constants/ThemeColors";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { useSync } from "@/providers/SyncProvider";
import { useStorageInfo, formatBytes } from "@/hooks/useStorageInfo";
import { ConfirmModal } from "@/components/common/ConfirmModal";

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

  const menuItems = [
    {
      icon: "cog-outline",
      label: "Settings",
      border: true,
      onPress: () => {},
    },
    {
      icon: "information-circle-outline",
      label: "About BadWave",
      border: false,
      onPress: () => {},
    },
  ];

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

          {/* 統計情報（ダミー） */}
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
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            Appearance
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
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
          </View>
        </View>

        {/* 同期セクション */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            Synchronization
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            <View style={styles.syncContent}>
              <View style={styles.syncInfo}>
                <Text style={[styles.syncLabel, { color: colors.text }]}>
                  Local Database
                </Text>
                <Text style={[styles.syncStatus, { color: colors.subText }]}>
                  {isSyncing
                    ? "Syncing now..."
                    : lastSyncTime
                    ? `Last Synced: ${lastSyncTime.toLocaleString()}`
                    : "Last Synced: Never"}
                </Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.syncButton,
                  { backgroundColor: colors.accentFrom },
                  isSyncing && { opacity: 0.6 },
                ]}
                onPress={triggerSync}
                disabled={isSyncing}
                activeOpacity={0.7}
              >
                {isSyncing ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <ActivityIndicator
                      size="small"
                      color="#FFF"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.syncButtonText}>Syncing...</Text>
                  </View>
                ) : (
                  <Text style={styles.syncButtonText}>Sync Now</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ストレージセクション */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            Storage
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            {/* ダウンロード済み楽曲 */}
            <View
              style={[
                styles.storageItem,
                { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
            >
              <View style={styles.storageInfo}>
                <View style={styles.storageIconContainer}>
                  <Ionicons
                    name="download-outline"
                    size={22}
                    color={colors.text}
                  />
                </View>
                <View>
                  <Text style={[styles.storageLabel, { color: colors.text }]}>
                    Downloads
                  </Text>
                  <Text
                    style={[styles.storageStatus, { color: colors.subText }]}
                  >
                    {isStorageLoading
                      ? "Loading..."
                      : `${downloadedCount} songs • ${formatBytes(
                          downloadedSize
                        )}`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.storageButton,
                  { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                  downloadedCount === 0 && { opacity: 0.5 },
                ]}
                onPress={() => setIsDeleteModalVisible(true)}
                disabled={downloadedCount === 0}
                activeOpacity={0.7}
                testID="delete-all-downloads-button"
              >
                <Text style={[styles.storageButtonText, { color: "#EF4444" }]}>
                  Delete All
                </Text>
              </TouchableOpacity>
            </View>

            {/* キャッシュ */}
            <View style={styles.storageItem}>
              <View style={styles.storageInfo}>
                <View style={styles.storageIconContainer}>
                  <Ionicons
                    name="trash-outline"
                    size={22}
                    color={colors.text}
                  />
                </View>
                <View>
                  <Text style={[styles.storageLabel, { color: colors.text }]}>
                    Cache
                  </Text>
                  <Text
                    style={[styles.storageStatus, { color: colors.subText }]}
                  >
                    Clear cached data
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.storageButton,
                  { backgroundColor: colors.accentFrom + "20" },
                ]}
                onPress={clearQueryCache}
                activeOpacity={0.7}
                testID="clear-cache-button"
              >
                <Text
                  style={[
                    styles.storageButtonText,
                    { color: colors.accentFrom },
                  ]}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* メニューリスト */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionTitle, { color: colors.subText }]}>
            General
          </Text>
          <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  item.border && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  },
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.menuIconContainer}>
                  <Ionicons
                    name={item.icon as any}
                    size={22}
                    color={colors.text}
                  />
                </View>
                <Text style={[styles.menuLabel, { color: colors.text }]}>
                  {item.label}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={colors.subText}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ログアウトボタン */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Text style={[styles.logoutText, { color: colors.text }]}>
            Log out
          </Text>
        </TouchableOpacity>

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
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.5,
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
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
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
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    height: 30,
  },
  menuContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  menuIconContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  menuLabel: {
    flex: 1,
    fontSize: 16,
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
    fontWeight: "500",
  },
  logoutButton: {
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: "center",
    borderWidth: 1,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    fontSize: 12,
    marginTop: 20,
  },
  syncContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  syncInfo: {
    flex: 1,
    marginRight: 12,
  },
  syncLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  syncStatus: {
    fontSize: 12,
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  syncButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "bold",
  },
  storageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  storageInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  storageIconContainer: {
    width: 32,
    alignItems: "center",
    marginRight: 12,
  },
  storageLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  storageStatus: {
    fontSize: 12,
  },
  storageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  storageButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
