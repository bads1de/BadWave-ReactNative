import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { useDownloadedSongs } from '../../hooks/useDownloadedSongs';
import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import Library from '../../app/(tabs)/library';

// モック
jest.mock('../../hooks/useDownloadedSongs');
jest.mock('../../hooks/useAudioPlayer');
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn().mockImplementation(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));
jest.mock('expo-router', () => ({
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));
jest.mock('../../providers/AuthProvider', () => ({
  useAuth: jest.fn().mockReturnValue({
    session: { user: { id: 'test-user' } },
  }),
}));
jest.mock('../../hooks/useAuthStore', () => ({
  useAuthStore: jest.fn().mockReturnValue({
    user: { id: 'test-user' },
  }),
}));
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('../../components/SongItem', () => ({
  __esModule: true,
  default: ({ song, onPress }) => (
    <div data-testid={`song-item-${song.id}`} onClick={onPress}>
      {song.title}
    </div>
  ),
}));
jest.mock('../../components/PlaylistItem', () => ({
  __esModule: true,
  default: ({ playlist, onPress }) => (
    <div data-testid={`playlist-item-${playlist.id}`} onClick={onPress}>
      {playlist.name}
    </div>
  ),
}));
jest.mock('../../components/CreatePlaylist', () => ({
  __esModule: true,
  default: () => <div data-testid="create-playlist">Create Playlist</div>,
}));
jest.mock('../../components/Loading', () => ({
  __esModule: true,
  default: () => <div data-testid="loading">Loading...</div>,
}));
jest.mock('../../components/Error', () => ({
  __esModule: true,
  default: ({ message }) => <div data-testid="error">{message}</div>,
}));
jest.mock('../../components/CustomButton', () => ({
  __esModule: true,
  default: ({ label, onPress }) => (
    <button data-testid={`button-${label}`} onClick={onPress}>
      {label}
    </button>
  ),
}));

describe('Library Screen - Downloads Tab', () => {
  const mockDownloadedSongs = [
    {
      id: 'song-1',
      title: 'Downloaded Song 1',
      author: 'Artist 1',
      image_path: 'https://example.com/image1.jpg',
      song_path: '/local/path/song1.mp3',
      user_id: 'test-user',
      created_at: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 'song-2',
      title: 'Downloaded Song 2',
      author: 'Artist 2',
      image_path: 'https://example.com/image2.jpg',
      song_path: '/local/path/song2.mp3',
      user_id: 'test-user',
      created_at: '2023-01-01T00:00:00.000Z',
    },
  ];

  const mockTogglePlayPause = jest.fn();
  const mockRefreshDownloads = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // useDownloadedSongsのモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: mockDownloadedSongs,
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });
    
    // useAudioPlayerのモック
    (useAudioPlayer as jest.Mock).mockReturnValue({
      togglePlayPause: mockTogglePlayPause,
    });
  });

  it('should render downloaded songs when downloads tab is selected', async () => {
    const { getByTestId, getAllByTestId, queryByText } = render(<Library />);
    
    // Downloadsタブをクリック
    fireEvent.press(getByTestId('button-Downloads'));
    
    // ダウンロード済み曲が表示されることを確認
    await waitFor(() => {
      expect(getAllByTestId(/song-item-/)).toHaveLength(2);
      expect(queryByText('Downloaded Song 1')).toBeTruthy();
      expect(queryByText('Downloaded Song 2')).toBeTruthy();
    });
    
    // refreshDownloadsが呼ばれたことを確認
    expect(mockRefreshDownloads).toHaveBeenCalled();
  });

  it('should show loading state when downloads are loading', async () => {
    // ローディング状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: true,
      error: null,
      refresh: mockRefreshDownloads,
    });
    
    const { getByTestId } = render(<Library />);
    
    // Downloadsタブをクリック
    fireEvent.press(getByTestId('button-Downloads'));
    
    // ローディング状態が表示されることを確認
    expect(getByTestId('loading')).toBeTruthy();
  });

  it('should show error state when downloads fetch fails', async () => {
    // エラー状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: 'Failed to fetch downloads',
      refresh: mockRefreshDownloads,
    });
    
    const { getByTestId } = render(<Library />);
    
    // Downloadsタブをクリック
    fireEvent.press(getByTestId('button-Downloads'));
    
    // エラー状態が表示されることを確認
    expect(getByTestId('error')).toBeTruthy();
  });

  it('should show empty state when no downloads are available', async () => {
    // 空の状態をモック
    (useDownloadedSongs as jest.Mock).mockReturnValue({
      songs: [],
      isLoading: false,
      error: null,
      refresh: mockRefreshDownloads,
    });
    
    const { getByTestId, queryByText } = render(<Library />);
    
    // Downloadsタブをクリック
    fireEvent.press(getByTestId('button-Downloads'));
    
    // 空の状態が表示されることを確認
    expect(queryByText('No downloaded songs found.')).toBeTruthy();
  });

  it('should call togglePlayPause when a downloaded song is pressed', async () => {
    const { getByTestId } = render(<Library />);
    
    // Downloadsタブをクリック
    fireEvent.press(getByTestId('button-Downloads'));
    
    // 曲をクリック
    fireEvent.press(getByTestId('song-item-song-1'));
    
    // togglePlayPauseが呼ばれたことを確認
    expect(mockTogglePlayPause).toHaveBeenCalledWith('song-1');
  });
});
