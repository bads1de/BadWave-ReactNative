import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import MiniPlayer from "@/components/player/MiniPlayer";
import Player from "@/components/player/Player";
import SubPlayer from "@/components/player/SubPlayer";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useAudioStore } from "@/hooks/stores/useAudioStore";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";
import { useSubPlayerStore } from "@/hooks/stores/useSubPlayerStore";

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
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const setShowPlayer = usePlayerStore((state) => state.setShowPlayer);
  const isMiniPlayerVisible = usePlayerStore(
    (state) => state.isMiniPlayerVisible
  );
  const currentSong = useAudioStore((state) => state.currentSong);
  const repeatMode = useAudioStore((state) => state.repeatMode);
  const shuffle = useAudioStore((state) => state.shuffle);

  // サブプレイヤーの状態
  const showSubPlayer = useSubPlayerStore((state) => state.showSubPlayer);
  const setShowSubPlayer = useSubPlayerStore((state) => state.setShowSubPlayer);

  // 再生コントロール関数と進捗情報を取得
  const {
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    setRepeat,
    setShuffle,
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
            isMiniPlayerVisible && (
              <View style={styles.miniPlayerContainer}>
                <MiniPlayer
                  currentSong={currentSong}
                  isPlaying={isPlaying}
                  onPlayPause={() => togglePlayPause()}
                  onPress={() => setShowPlayer(true)}
                />
              </View>
            )
          )}
        </>
      )}
    </>
  );
}

// カスタム比較関数を使用して、必要な場合のみ再レンダリングする
const MemoizedPlayerContainer = memo(
  PlayerContainer,
  (_prevProps, _nextProps) => {
    // PlayerContainerはプロップを受け取らないため、常に同じとみなす
    return true;
  }
);

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

