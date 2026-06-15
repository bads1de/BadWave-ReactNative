import {
  genreCards,
  CACHE_PREFIX,
  CACHED_QUERIES,
  SYNC_STORAGE_KEY,
  SEARCH_HISTORY_STORAGE_KEY,
  CACHE_CONFIG,
} from "@/constants/index";

describe("constants", () => {
  describe("genreCards", () => {
    it("8つのジャンルカードが定義されている", () => {
      expect(genreCards).toHaveLength(8);
    });

    it("各ジャンルカードにidとnameが存在する", () => {
      genreCards.forEach((card) => {
        expect(card).toHaveProperty("id");
        expect(card).toHaveProperty("name");
        expect(typeof card.id).toBe("number");
        expect(typeof card.name).toBe("string");
      });
    });

    it("idが重複していない", () => {
      const ids = genreCards.map((card) => card.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe("CACHE_PREFIX", () => {
    it("@query-cacheが定義されている", () => {
      expect(CACHE_PREFIX).toBe("@query-cache");
    });
  });

  describe("CACHED_QUERIES", () => {
    it("必要なクエリキーが全て定義されている", () => {
      const requiredKeys = [
        "song",
        "songs",
        "search",
        "songsByGenre",
        "trendsSongs",
        "likedSongs",
        "playlists",
        "playlistById",
        "playlistSongs",
        "spotlights",
        "user",
        "topPlayedSongs",
        "getPublicPlaylists",
        "getRecommendations",
        "downloadStatus",
        "downloadedSongs",
        "playlistStatus",
      ];

      requiredKeys.forEach((key) => {
        expect(CACHED_QUERIES).toHaveProperty(key);
      });
    });
  });

  describe("SYNC_STORAGE_KEY", () => {
    it("@last_sync_timeが定義されている", () => {
      expect(SYNC_STORAGE_KEY).toBe("@last_sync_time");
    });
  });

  describe("SEARCH_HISTORY_STORAGE_KEY", () => {
    it("@search_historyが定義されている", () => {
      expect(SEARCH_HISTORY_STORAGE_KEY).toBe("@search_history");
    });
  });

  describe("CACHE_CONFIG", () => {
    it("staleTimeが10分間で定義されている", () => {
      expect(CACHE_CONFIG.staleTime).toBe(1000 * 60 * 10);
    });

    it("gcTimeが7日間で定義されている", () => {
      expect(CACHE_CONFIG.gcTime).toBe(1000 * 60 * 60 * 24 * 7);
    });
  });
});
