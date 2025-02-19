export const genreCards = [
  { id: 1, name: "Retro Wave" },
  { id: 2, name: "Electro House" },
  { id: 3, name: "Nu Disco" },
  { id: 4, name: "City Pop" },
  { id: 5, name: "Tropical House" },
  { id: 6, name: "Vapor Wave" },
  { id: 7, name: "Trance" },
  { id: 8, name: "Drum and Bass" },
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
} as const;

export const CACHE_CONFIG = {
  staleTime: 1000 * 60 * 30, // 30分間
  gcTime: 1000 * 60 * 60, // 60分間
} as const;
