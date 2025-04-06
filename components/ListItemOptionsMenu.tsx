import React, { useState, memo } from "react";
import { Modal, View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

interface ListItemOptionsMenuProps {
  onDelete?: () => void;
}

const ListItemOptionsMenu = ({ onDelete }: ListItemOptionsMenuProps) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.menuButton}
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <BlurView intensity={30} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {onDelete && (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onDelete();
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                  <Text style={[styles.optionText, styles.deleteText]}>
                    削除
                  </Text>
                </TouchableOpacity>
              )}

              {/* 将来的に他のオプションを追加可能 */}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// メモ化してエクスポート
export default memo(ListItemOptionsMenu);

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalContent: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },
  deleteText: {
    color: "#ff4444",
  },
});
