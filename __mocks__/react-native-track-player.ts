// react-native-track-player のモック
const mockTrackPlayer = {
  setupPlayer: jest.fn().mockResolvedValue(undefined),
  updateOptions: jest.fn().mockResolvedValue(undefined),
  add: jest.fn().mockResolvedValue(undefined),
  remove: jest.fn().mockResolvedValue(undefined),
  skip: jest.fn().mockResolvedValue(undefined),
  skipToNext: jest.fn().mockResolvedValue(undefined),
  skipToPrevious: jest.fn().mockResolvedValue(undefined),
  play: jest.fn().mockResolvedValue(undefined),
  pause: jest.fn().mockResolvedValue(undefined),
  stop: jest.fn().mockResolvedValue(undefined),
  reset: jest.fn().mockResolvedValue(undefined),
  getTrack: jest.fn().mockResolvedValue({}),
  getCurrentTrack: jest.fn().mockResolvedValue('track-id'),
  getQueue: jest.fn().mockResolvedValue([]),
  getState: jest.fn().mockResolvedValue(0),
  getPosition: jest.fn().mockResolvedValue(0),
  getDuration: jest.fn().mockResolvedValue(0),
  getBufferedPosition: jest.fn().mockResolvedValue(0),
  seekTo: jest.fn().mockResolvedValue(undefined),
  setVolume: jest.fn().mockResolvedValue(undefined),
  setRate: jest.fn().mockResolvedValue(undefined),
  setRepeatMode: jest.fn().mockResolvedValue(undefined),
};

export default mockTrackPlayer;

export const useTrackPlayerEvents = jest.fn();
export const useProgress = jest.fn().mockReturnValue({
  position: 0,
  duration: 0,
  buffered: 0,
});
export const usePlaybackState = jest.fn().mockReturnValue({ state: 'ready' });
export const State = {
  None: 0,
  Ready: 1,
  Playing: 2,
  Paused: 3,
  Stopped: 4,
  Buffering: 5,
  Connecting: 6,
};
export const RepeatMode = {
  Off: 0,
  Track: 1,
  Queue: 2,
};
export const Event = {
  PlaybackState: 'playback-state',
  PlaybackError: 'playback-error',
  PlaybackQueueEnded: 'playback-queue-ended',
  PlaybackTrackChanged: 'playback-track-changed',
  RemotePlay: 'remote-play',
  RemotePause: 'remote-pause',
  RemoteStop: 'remote-stop',
  RemoteNext: 'remote-next',
  RemotePrevious: 'remote-previous',
  RemoteJumpForward: 'remote-jump-forward',
  RemoteJumpBackward: 'remote-jump-backward',
  RemoteSeek: 'remote-seek',
  RemoteDuck: 'remote-duck',
};
