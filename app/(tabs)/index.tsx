import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { songs } from "../../data/songs";
import { Ionicons } from "@expo/vector-icons";
import Player from "../../components/Player";
import MiniPlayer from "../../components/MiniPlayer";
import { useCallback } from "react";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { usePlayerStore } from "../../hooks/usePlayerStore";

export default function HomeScreen() {
  const { showPlayer, setShowPlayer } = usePlayerStore();

  const {
    sound,
    isPlaying,
    currentSong,
    position,
    duration,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
  } = useAudioPlayer(songs);

  const renderItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        style={styles.songItem}
        onPress={async () => {
          await togglePlayPause(item);
        }}
      >
        <Image source={item.image_path} style={styles.image} />
        <View style={styles.songInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.author}>{item.author}</Text>
        </View>
        <TouchableOpacity
          onPress={async (e) => {
            e.stopPropagation();
            await togglePlayPause(item);
          }}
        >
          <Ionicons
            name={
              currentSong?.id === item.id && isPlaying
                ? "pause-circle"
                : "play-circle"
            }
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [currentSong, isPlaying, togglePlayPause]
  );

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.listWrapper,
          currentSong && !showPlayer && { marginBottom: 70 },
        ]}
      >
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      </View>
      {showPlayer && currentSong ? (
        <View style={styles.playerContainer}>
          <Player
            sound={sound}
            isPlaying={isPlaying}
            currentSong={currentSong}
            position={position}
            duration={duration}
            onPlayPause={() => togglePlayPause()}
            onNext={playNextSong}
            onPrev={playPrevSong}
            onSeek={seekTo}
            onClose={() => setShowPlayer(false)}
            repeat={repeat}
            setRepeat={setRepeat}
            shuffle={shuffle}
            setShuffle={setShuffle}
          />
        </View>
      ) : null}
      {currentSong && !showPlayer ? (
        <MiniPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          onPlayPause={togglePlayPause}
          onPress={() => setShowPlayer(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#111",
    marginBottom: 10,
    borderRadius: 8,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  author: {
    color: "#999",
    fontSize: 14,
  },
  playerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#000",
  },
});
