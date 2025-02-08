import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import  Song  from '../types';

interface MiniPlayerProps {
  currentSong: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPress: () => void;
}

export default function MiniPlayer({ currentSong, isPlaying, onPlayPause, onPress }: MiniPlayerProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={currentSong.image_path} style={styles.image} />
      <View style={styles.songInfo}>
        <Text style={styles.title}>{currentSong.title}</Text>
        <Text style={styles.author}>{currentSong.author}</Text>
      </View>
      <TouchableOpacity onPress={(e) => {
        e.stopPropagation();
        onPlayPause();
      }}>
        <Ionicons 
          name={isPlaying ? "pause-circle" : "play-circle"} 
          size={40} 
          color="#fff" 
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#222',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  songInfo: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  author: {
    color: '#999',
    fontSize: 12,
  },
});