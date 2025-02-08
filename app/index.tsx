import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { songs } from '../data/songs';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { useCallback, useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function Index() {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSongId, setCurrentSongId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (err) {
        console.error('Failed to set audio mode:', err);
        setError('オーディオの初期化に失敗しました');
      }
    })();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const playNextSong = useCallback(() => {
    const currentIndex = songs.findIndex(song => song.id === currentSongId);
    const nextIndex = currentIndex + 1;
    if (nextIndex < songs.length) {
      const nextSong = songs[nextIndex];
      playSound(nextSong.song_path, nextSong.id);
    } else {
      // プレイリストの最初に戻る
      const firstSong = songs[0];
      playSound(firstSong.song_path, firstSong.id);
    }
  }, [currentSongId]);

  const stopSound = async () => {
    try {
      if (sound) {
        await sound.unloadAsync();
        setSound(null);
        setIsPlaying(false);
        setCurrentSongId(null);
      }
    } catch (err) {
      console.error('Failed to stop sound:', err);
      setError('音楽の停止に失敗しました');
    }
  };

  const playSound = async (songPath: string, songId: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }

      const asset = Asset.fromModule(songPath);
      await asset.downloadAsync();
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        asset,
        { shouldPlay: true },
        (status) => {
          if (!status.isLoaded) return;
          
          setIsPlaying(status.isPlaying);
          
          if (status.positionMillis && status.durationMillis && 
              status.positionMillis >= status.durationMillis) {
            // 曲が終わったら次の曲を再生
            playNextSong();
          }
        }
      );

      setSound(newSound);
      setCurrentSongId(songId);
      setIsPlaying(true);
      setError(null);
    } catch (err) {
      console.error('Failed to play sound:', err);
      setError('音楽の再生に失敗しました');
    }
  };

  const togglePlayPause = async (songPath: string, songId: string) => {
    try {
      if (sound && currentSongId === songId) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        await playSound(songPath, songId);
      }
    } catch (err) {
      console.error('Failed to toggle play/pause:', err);
      setError('音楽の操作に失敗しました');
    }
  };

  const renderItem = useCallback(({ item }: any) => (
    <TouchableOpacity 
      style={styles.songItem}
      onPress={() => togglePlayPause(item.song_path, item.id)}
    >
      <Image source={item.image_path} style={styles.image} />
      <View style={styles.songInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>{item.author}</Text>
      </View>
      <Ionicons 
        name={currentSongId === item.id && isPlaying ? "pause-circle" : "play-circle"} 
        size={40} 
        color="#fff" 
      />
    </TouchableOpacity>
  ), [currentSongId, isPlaying]);

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      <FlatList
        data={songs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  listContainer: {
    padding: 16,
  },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#111',
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
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  author: {
    color: '#999',
    fontSize: 14,
  },
  errorContainer: {
    padding: 10,
    backgroundColor: '#ff0000',
    margin: 10,
    borderRadius: 5,
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  }
});
