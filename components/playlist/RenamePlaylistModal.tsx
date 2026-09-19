import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

interface RenamePlaylistModalProps {
  visible: boolean;
  currentTitle?: string;
  onClose: () => void;
  /** 更新ボタン押下時に入力中のタイトルを渡す */
  onSave: (title: string) => void;
}

/**
 * プレイリスト名変更モーダル。
 * PlaylistOptionsMenu から切り出した副次モーダル。
 */
export function RenamePlaylistModal({
  visible,
  currentTitle,
  onClose,
  onSave,
}: RenamePlaylistModalProps) {
  const colors = useThemeStore((state) => state.colors);
  const [newTitle, setNewTitle] = useState(currentTitle || "");

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.renameOverlay} testID="rename-modal">
        <View
          style={[
            styles.renameCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          testID="rename-card"
        >
          <View style={styles.renameHeader}>
            <Text style={[styles.renameTitle, { color: colors.text }]}>
              Rename
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={20} color={colors.subText} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
            value={newTitle}
            onChangeText={setNewTitle}
            placeholder="Enter new title"
            placeholderTextColor={colors.subText}
            autoFocus
            selectionColor={colors.primary}
          />

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={() => onSave(newTitle)}
          >
            <Text style={[styles.saveBtnText, { color: colors.primaryDark }]}>
              Update Name
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default RenamePlaylistModal;

const styles = StyleSheet.create({
  renameOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  renameCard: {
    width: "100%",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  renameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  renameTitle: {
    fontSize: 20,
    fontFamily: FONTS.title,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: FONTS.body,
    borderWidth: 1,
    marginBottom: 24,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
