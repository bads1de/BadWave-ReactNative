import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useEffect, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';

interface PlayerProps {
  sound: Audio.Sound | null;
  isPlaying: boolean;
  currentSong: any;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

export default function Player({ 
  sound, 
  isPlaying, 
  currentSong, 
  onPlayPause, 
  onNext,
  onPrev,
  onClose
}: PlayerProps) {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isRepeat, setIsRepeat] = useState(false);
  const router = useRouter();

  const updateAudioState = useCallback(async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
        }
      } catch (err) {
        console.error('Failed to update audio state:', err);
      }
    }
  }, [sound]);

  useEffect(() => {
    if (sound) {
      const interval = setInterval(updateAudioState, 1000);
      updateAudioState();
      return () => clearInterval(interval);
    }
  }, [sound, updateAudioState]);

  useEffect(() => {
    const syncAudioState = async () => {
      if (sound) {
        try {
          const status = await sound.getStatusAsync();
          if (status.isLoaded) {
            setPosition(status.positionMillis);
            setDuration(status.durationMillis || 0);
          }
        } catch (err) {
          console.error('Failed to sync audio state:', err);
        }
      }
    };
    
    syncAudioState();
  }, [sound, isPlaying]);

  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  const handleSeek = async (value: number) => {
    if (sound) {
      await sound.setPositionAsync(value);
      setPosition(value);
    }
  };

  const handleClose = useCallback(async () => {
    if (sound) {
      // 現在の再生状態を保存
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        // 再生中の場合は、その状態を維持したまま閉じる
        onClose();
      } else {
        onClose();
      }
    } else {
      onClose();
    }
  }, [sound, onClose]);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
          onSlidingComplete={handleSeek}
          minimumTrackTintColor="#1DB954"
          maximumTrackTintColor="#777"
          thumbTintColor="#1DB954"
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(position)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>

        <View style={styles.controls}>
          <TouchableOpacity >
           <Ionicons name="shuffle" size={25} color="#fff" />
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

          <TouchableOpacity onPress={() => setIsRepeat(!isRepeat)}>
          <Ionicons 
              name="repeat" 
              size={25} 
              color={isRepeat ? "#1DB954" : "#fff"} 
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