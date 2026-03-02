import React, { memo, useState, useEffect } from "react";
import { View, Text, StyleSheet, AppState, AppStateStatus } from "react-native";
import Slider from "@react-native-community/slider";
import { formatTime } from "@/lib/utils/formatTime";
import { useProgress } from "react-native-track-player";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface PlayerProgressProps {
  onSeek: (millis: number) => void;
}

/**
 * プレーヤーの進捗バーコンポーネント
 * 再生位置の更新による再レンダリングをこのコンポーネント内に閉じ込める
 */
const PlayerProgress = memo(({ onSeek }: PlayerProgressProps) => {
  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState,
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  // アプリがバックグラウンドの時は更新頻度を落としリソース消費を抑える
  const updateInterval = appState === "active" ? 200 : 5000;
  const { position, duration } = useProgress(updateInterval);

  const colors = useThemeStore((state) => state.colors);

  const handleSeek = (value: number) => {
    onSeek(value);
  };

  return (
    <>
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration * 1000} // durationは秒単位で来る場合があるので確認が必要だが、TrackPlayerのuseProgressは秒単位
        value={position * 1000} // 秒 -> ミリ秒に変換（Sliderがミリ秒期待なら）
        // いや、badwave-mobileの慣習を見るとミリ秒で扱っている箇所が多い。
        // useAudioPlayer.tsを見ると: const progressPosition = position * 1000;
        // なので、ここでも * 1000 してミリ秒にする
        onSlidingComplete={handleSeek}
        minimumTrackTintColor={colors.primary}
        maximumTrackTintColor={colors.subText}
        thumbTintColor={colors.primary}
        testID="seek-slider"
      />
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.subText }]}>
          {formatTime(position * 1000)}
        </Text>
        <Text style={[styles.timeText, { color: colors.subText }]}>
          {formatTime(duration * 1000)}
        </Text>
      </View>
    </>
  );
});

PlayerProgress.displayName = "PlayerProgress";

const styles = StyleSheet.create({
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
  },
  timeText: {
    color: "#999",
    fontSize: 12,
  },
});

export default PlayerProgress;
