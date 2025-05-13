import React, { memo } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";

interface CustomAlertDialogProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const { width } = Dimensions.get("window");

function CustomAlertDialog({
  visible,
  onConfirm,
  onCancel,
}: CustomAlertDialogProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onCancel}
      testID="alert-dialog-container"
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>
            本当にこのプレイリストを削除しますか？
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              testID="cancel-button"
            >
              <Text style={styles.buttonText}>cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.confirmButton]}
              onPress={onConfirm}
              testID="confirm-button"
            >
              <Text style={styles.buttonText}>delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// カスタム比較関数を使用してメモ化
export default memo(CustomAlertDialog, (prevProps, nextProps) => {
  // visible, onConfirm, onCancelプロパティが同じ場合は再レンダリングしない
  return (
    prevProps.visible === nextProps.visible &&
    prevProps.onConfirm === nextProps.onConfirm &&
    prevProps.onCancel === nextProps.onCancel
  );
});

// 変更後のスタイル定義
const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#4c1d95",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    width: width * 0.8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 18,
    color: "#fff",
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 25,
    elevation: 3,
    width: "48%",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  confirmButton: {
    backgroundColor: "#4c1d95",
    shadowColor: "#4c1d95",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
    textAlign: "center",
    fontSize: 16,
  },
});
