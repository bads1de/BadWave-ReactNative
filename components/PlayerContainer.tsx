import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import MiniPlayer from "@/components/MiniPlayer";
import Player from "@/components/Player";
import SubPlayer from "@/components/SubPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/hooks/useAudioStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";

/**
 * プレーヤーコンテナコンポーネント
 *
 * このコンポーネントは、MiniPlayer、Player、SubPlayerコンポーネントを管理し、
 * 再生状態の更新による不要な再レンダリングを防ぎます。
 *
 * 改善点:
 * - SubPlayerContainerを統合し、コンポーネント階層を簡素化
 * - 適切なzIndex管理による表示順序の制御
 */
function PlayerContainer() {
  // メインプレイヤーの状態
  const { showPlayer, setShowPlayer } = usePlayerStore();
  const { currentSong, repeatMode, shuffle } = useAudioStore();

  // サブプレイヤーの状態
  const { showSubPlayer, setShowSubPlayer } = useSubPlayerStore();

  // 再生コントロール関数と進捗情報を取得
  const {
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    setRepeat,
    setShuffle,
    progressPosition,
    progressDuration,
  } = useAudioPlayer();

  // メインプレイヤーが表示されない条件
  const shouldHideMainPlayer = !currentSong;

  return (
    <>
      {/* サブプレイヤー（最も前面に表示） */}
      {showSubPlayer && (
        <View style={styles.subPlayerContainer}>
          <SubPlayer onClose={() => setShowSubPlayer(false)} />
        </View>
      )}

      {/* メインプレイヤー（サブプレイヤーの下に表示） */}
      {!shouldHideMainPlayer && (
        <>
          {showPlayer ? (
            <View style={styles.fullPlayerContainer}>
              <Player
                isPlaying={isPlaying}
                currentSong={currentSong}
                position={progressPosition}
                duration={progressDuration}
                onPlayPause={() => togglePlayPause()}
                onNext={playNextSong}
                onPrev={playPrevSong}
                onSeek={seekTo}
                onClose={() => setShowPlayer(false)}
                repeatMode={repeatMode}
                setRepeatMode={setRepeat}
                shuffle={shuffle}
                setShuffle={setShuffle}
              />
            </View>
          ) : (
            <View style={styles.miniPlayerContainer}>
              <MiniPlayer
                currentSong={currentSong}
                isPlaying={isPlaying}
                onPlayPause={() => togglePlayPause()}
                onPress={() => setShowPlayer(true)}
              />
            </View>
          )}
        </>
      )}
    </>
  );
}

// メモ化してパフォーマンスを向上
const MemoizedPlayerContainer = memo(PlayerContainer);

export default MemoizedPlayerContainer;

const styles = StyleSheet.create({
  subPlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, // 最前面に表示
  },
  swipeablePlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 15,
  },
  fullPlayerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 10,
  },
  miniPlayerContainer: {
    position: "absolute",
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 5,
  },
});
