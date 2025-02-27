import 'expo-router/entry';
import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';
import { PlaybackService } from './services/trackPlayerService';

// Register the playback service
TrackPlayer.registerPlaybackService(() => PlaybackService);

// This is the first file that will be executed when the application starts
// The registerRootComponent call is handled by Expo internally
