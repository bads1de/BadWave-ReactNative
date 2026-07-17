import React, { memo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  AppState,
  AppStateStatus,
} from "react-native";
import Slider from "@react-native-community/slider";
import { formatTime } from "@/lib/utils/formatTime";
import { useProgress } from "@rntp/player";
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

  // アプリがバックグラウンドの時は更新頻度を落としリソース消費を抑える（v5 の useProgress は秒単位）
  const updateInterval = appState === "active" ? 0.2 : 5;
  const { position, duration } = useProgress(updateInterval);

  const colors = useThemeStore((state) => state.colors);

  // duration が未確定の間（prepare 前）は ExoPlayer が TIME_UNSET（負の巨大値）を返すため、
  // 不正値を 0 に丸めてスライダーと時間表示が壊れないようにする
  const safeDuration =
    Number.isFinite(duration) && duration > 0 ? duration : 0;

  const handleSeek = (value: number) => {
    onSeek(value);
  };

  return (
    <>
      <Slider
        style={styles.slider}
        minimumValue={0}
        // useProgress は秒単位で返すため、ミリ秒に変換して扱う
        maximumValue={safeDuration * 1000}
        value={position * 1000}
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
          {formatTime(safeDuration * 1000)}
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
