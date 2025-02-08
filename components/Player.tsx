import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

interface PlayerProps {
  sound: any;
  isPlaying: boolean;
  currentSong: any;
  position: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (millis: number) => void;
  onClose: () => void;
  repeat: boolean;
  setRepeat: (value: boolean) => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
}

export default function Player({ 
  isPlaying, 
  currentSong, 
  position, 
  duration, 
  onPlayPause, 
  onNext,
  onPrev,
  onSeek,
  onClose,
  repeat,
  setRepeat,
  shuffle,
  setShuffle,
}: PlayerProps) {
  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="chevron-down" size={30} color="#fff" />
      </TouchableOpacity>

      <View style={styles.artworkContainer}>
        <Image source={currentSong.image_path} style={styles.artwork} />
      </View>

      <View style={styles.infoContainer}>
        <Text style={styles.title}>{currentSong.title}</Text>
        <Text style={styles.author}>{currentSong.author}</Text>
      </View>

      <View style={styles.controlsContainer}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={duration}
          value={position}
          onSlidingComplete={onSeek}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#777"
          thumbTintColor="#1DB954"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setShuffle(!shuffle)}>
            <Ionicons name="shuffle" size={25} color={shuffle ? "#1DB954" : "#fff"} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={onPrev}>
            <Ionicons name="play-skip-back" size={35} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
            <Ionicons 
              name={isPlaying ? "pause-circle" : "play-circle"} 
              size={70} 
              color="#fff" 
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onNext}>
            <Ionicons name="play-skip-forward" size={35} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRepeat(!repeat)}>
            <Ionicons 
              name="repeat" 
              size={25} 
              color={repeat ? "#1DB954" : "#fff"} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
  },
  artworkContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  artwork: {
    width: Dimensions.get('window').width - 80,
    height: Dimensions.get('window').width - 80,
    borderRadius: 10,
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  author: {
    color: '#999',
    fontSize: 18,
    marginTop: 5,
  },
  controlsContainer: {
    marginTop: 40,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  timeText: {
    color: '#999',
    fontSize: 12,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  playButton: {
    transform: [{ scale: 1.2 }],
  },
});