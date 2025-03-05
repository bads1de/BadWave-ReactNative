import React, { useState, useEffect } from "react";
import { Text, View, StyleSheet, Image } from "react-native";
import TrackPlayer, {
  useTrackPlayerEvents,
  Event,
  Track,
  useActiveTrack,
} from "react-native-track-player";

const NextSong = () => {
  const activeTrack = useActiveTrack();
  const [nextSong, setNextSong] = useState<Track | null>(null);

  useEffect(() => {
    const fetchNextTrack = async () => {
      try {
        const queue = await TrackPlayer.getQueue();
        const currentIndex = await TrackPlayer.getActiveTrackIndex();

        if (
          currentIndex === -1 ||
          queue.length === 0 ||
          currentIndex === undefined
        )
          return;

        let nextTrackIndex = currentIndex + 1;

        // キューの最後の曲の場合
        if (nextTrackIndex >= queue.length) {
          nextTrackIndex = -1;
        }

        if (nextTrackIndex !== -1) {
          return setNextSong(queue[nextTrackIndex]);
        }

        setNextSong(null);
      } catch (error) {
        console.error("次の曲の取得中にエラーが発生しました:", error);
      }
    };

    fetchNextTrack();
  }, [activeTrack]);

  // 曲変更イベントの監視も維持
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        setNextSong(track);
      }
    }
  });

  if (!nextSong) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Next Song:</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Image
          source={{ uri: nextSong.artwork }}
          style={{ width: 80, height: 80, borderRadius: 8 }}
        />
        <View style={{ marginLeft: 40 }}>
          <Text style={styles.songName}>{nextSong.title}</Text>
          <Text style={styles.artist}>{nextSong.artist}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#000",
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  songName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  artist: {
    fontSize: 12,
    color: "#666",
  },
});

export default NextSong;
