export const genreCards = [
  { id: 1, name: "Retro Wave" },
  { id: 2, name: "Electro House" },
  { id: 3, name: "Nu Disco" },
  { id: 4, name: "City Pop" },
  { id: 5, name: "Tropical House" },
  { id: 6, name: "Vapor Wave" },
  { id: 7, name: "r&b" },
  { id: 8, name: "Chill House" },
];

export const CACHE_PREFIX = "@query-cache";

export const CACHED_QUERIES = {
  song: "song",
  songs: "songs",
  search: "search",
  songsByGenre: "songsByGenre",
  trendsSongs: "trendsSongs",
  likedSongs: "likedSongs",
  playlists: "playlists",
  playlistById: "playlistById",
  playlistSongs: "playlistSongs",
  spotlights: "spotlights",
  user: "user",
  topPlayedSongs: "topPlayedSongs",
  getPublicPlaylists: "getPublicPlaylists",
  getRecommendations: "getRecommendations",
  downloadStatus: "downloadStatus",
  downloadedSongs: "downloadedSongs",
  playlistStatus: "playlistStatus",
} as const;

export const SYNC_STORAGE_KEY = "@last_sync_time";
export const SEARCH_HISTORY_STORAGE_KEY = "@search_history";

export const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 10, // 10分間
  gcTime: 1000 * 60 * 60 * 24 * 7, // 7日間
} as const;

export const SUPABASE_TABLES = {
  songs: "songs",
  playlists: "playlists",
  playlistSongs: "playlist_songs",
  users: "users",
  likedSongsRegular: "liked_songs_regular",
  spotlights: "spotlights",
} as const;

export const ANIMATION_DURATION = {
  fast: 200,
  normal: 300,
  medium: 400,
  slow: 600,
  skeleton: 1200,
} as const;

export const SPRING_CONFIG = {
  gentle: { damping: 20, stiffness: 90 },
  snappy: { damping: 15, stiffness: 150 },
  smooth: { damping: 25, stiffness: 80 },
  default: { damping: 15, stiffness: 100 },
  bouncy: { damping: 10, stiffness: 80 },
} as const;

export const ROUTES = {
  home: "/",
  library: "/library",
  account: "/account",
  genre: "/genre/[genre]",
  song: "/song/[songId]",
  playlist: "/playlist/[playlistId]",
  tabsPlaylist: "/(tabs)/playlist/[playlistId]",
} as const;
