import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Settings2, Edit3, Globe, Lock, Trash2, Download, Check } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";
import Song, { IconComponent } from "@/types";
import BottomSheet from "@/components/common/BottomSheet";

interface PlaylistOptionsSheetProps {
  visible: boolean;
  onClose: () => void;
  currentTitle?: string;
  songs: Song[];
  isOwner: boolean;
  isPublic: boolean;
  isOnline: boolean;
  allDownloaded: boolean;
  downloadedCount: number;
  onEditName: () => void;
  onTogglePublic: () => void;
  onRequestDelete: () => void;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
}

/**
 * PlaylistOptionsMenu のオプションシート本体。
 * BottomSheet の共通スキャフォールドを利用する。
 */
export function PlaylistOptionsSheet({
  visible,
  onClose,
  currentTitle,
  songs,
  isOwner,
  isPublic,
  isOnline,
  allDownloaded,
  downloadedCount,
  onEditName,
  onTogglePublic,
  onRequestDelete,
  onBulkDownload,
  onBulkDelete,
}: PlaylistOptionsSheetProps) {
  const colors = useThemeStore((state) => state.colors);

  const renderOptionItem = (
    label: string,
    Icon: IconComponent,
    onPress: () => void,
    color: string = colors.text,
    subLabel?: string,
    isDisabled: boolean = false,
  ) => {
    const isDestructive = color === colors.error;
    const isSuccess = color === colors.success;

    // アイコンの色: 破壊的アクションは赤、成功/完了は緑、それ以外はテーマのプライマリ（アクセント）
    const iconColor = isDestructive
      ? colors.error
      : isSuccess
        ? colors.success
        : colors.primary;
    // テキストの色: 破壊的アクションのみ赤を維持し、それ以外は基本白（colors.text）
    const textColor = isDestructive ? colors.error : colors.text;

    return (
      <TouchableOpacity
        style={[styles.optionItem, isDisabled && styles.optionItemDisabled]}
        onPress={onPress}
        disabled={isDisabled}
      >
        <View style={styles.optionLeft}>
          <View
            style={[
              styles.iconBox,
              {
                borderColor: isDestructive
                  ? colors.error + "30"
                  : colors.border,
              },
            ]}
          >
            <Icon size={20} color={iconColor} strokeWidth={1.5} />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              {label}
            </Text>
            {subLabel && (
              <Text style={styles.optionSubLabel} numberOfLines={1}>
                {subLabel}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      overlayColor="rgba(0, 0, 0, 0.75)"
      rootTestID="options-modal"
      overlayTestID="options-modal-overlay"
      sheetStyle={styles.sheet}
      handleStyle={styles.handle}
      footer={
        <TouchableOpacity
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={onClose}
        >
          <Text style={[styles.cancelBtnText, { color: colors.text }]}>
            Done
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.sheetHeader}>
        <View style={styles.headerInfoRow}>
          {songs.length > 0 && songs[0].image_path ? (
            <Image
              source={{ uri: songs[0].image_path }}
              style={styles.headerImage}
              contentFit="cover"
            />
          ) : (
            <View
              style={[
                styles.headerImagePlaceholder,
                { backgroundColor: colors.card },
              ]}
            >
              <Settings2 size={24} color={colors.subText} strokeWidth={1.5} />
            </View>
          )}
          <View style={styles.headerTextContainer}>
            <Text
              style={[styles.sheetTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {currentTitle}
            </Text>
            <Text style={styles.sheetSubTitle} numberOfLines={1}>
              Playlist • {songs.length} tracks
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.headerSeparator,
            { backgroundColor: colors.border },
          ]}
        />
      </View>

      <View style={styles.optionsList}>
        {isOwner && (
          <>
            {renderOptionItem(
              "Edit Name",
              Edit3,
              onEditName,
              colors.text,
              undefined,
              !isOnline,
            )}

            {renderOptionItem(
              isPublic ? "Make Private" : "Make Public",
              isPublic ? Lock : Globe,
              onTogglePublic,
              colors.text,
              isPublic ? "Visible only to you" : "Visible to everyone",
              !isOnline,
            )}

            {renderOptionItem(
              "Delete Playlist",
              Trash2,
              onRequestDelete,
              colors.error,
              "Irreversible action",
              !isOnline,
            )}
          </>
        )}

        {songs.length > 0 && (
          <>
            {!allDownloaded
              ? renderOptionItem(
                  "Download All",
                  Download,
                  onBulkDownload,
                  colors.text,
                  `${songs.length - downloadedCount} tracks remaining`,
                  !isOnline,
                )
              : renderOptionItem(
                  "Clear Downloads",
                  Check,
                  onBulkDelete,
                  colors.success,
                  `${downloadedCount} tracks saved offline`,
                )}
          </>
        )}
      </View>
    </BottomSheet>
  );
}

export default PlaylistOptionsSheet;

const styles = StyleSheet.create({
  sheet: {
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginTop: 0,
    marginBottom: 24,
    alignSelf: "center",
  },
  sheetHeader: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  headerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  sheetSubTitle: {
    fontSize: 14,
    color: "#A8A29E",
    fontFamily: FONTS.body,
    opacity: 0.7,
    marginTop: 2,
  },
  headerSeparator: {
    height: 1,
    width: "100%",
    marginTop: 20,
    opacity: 0.3,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  optionItemDisabled: {
    opacity: 0.4,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  optionSubLabel: {
    fontSize: 12,
    color: "#A8A29E",
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 32,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
