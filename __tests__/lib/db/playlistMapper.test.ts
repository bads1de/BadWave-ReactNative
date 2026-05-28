import { mapPlaylistRowToPlaylist } from "@/lib/db/playlistMapper";

describe("mapPlaylistRowToPlaylist", () => {
  it("should map SQLite row to Playlist type", () => {
    const row = {
      id: "test-id",
      userId: "user-id",
      title: "Test Playlist",
      imagePath: "/path/to/image.jpg",
      isPublic: true,
      createdAt: "2024-01-01T00:00:00Z",
    };

    const result = mapPlaylistRowToPlaylist(row);

    expect(result).toEqual({
      id: "test-id",
      user_id: "user-id",
      title: "Test Playlist",
      image_path: "/path/to/image.jpg",
      is_public: true,
      created_at: "2024-01-01T00:00:00Z",
    });
  });

  it("should handle null imagePath by converting to undefined", () => {
    const row = {
      id: "test-id",
      userId: "user-id",
      title: "Test Playlist",
      imagePath: null,
      isPublic: true,
      createdAt: "2024-01-01T00:00:00Z",
    };

    const result = mapPlaylistRowToPlaylist(row);

    expect(result.image_path).toBeUndefined();
  });

  it("should handle null isPublic by defaulting to false", () => {
    const row = {
      id: "test-id",
      userId: "user-id",
      title: "Test Playlist",
      imagePath: null,
      isPublic: null,
      createdAt: "2024-01-01T00:00:00Z",
    };

    const result = mapPlaylistRowToPlaylist(row);

    expect(result.is_public).toBe(false);
  });

  it("should handle null createdAt by defaulting to empty string", () => {
    const row = {
      id: "test-id",
      userId: "user-id",
      title: "Test Playlist",
      imagePath: null,
      isPublic: null,
      createdAt: null,
    };

    const result = mapPlaylistRowToPlaylist(row);

    expect(result.created_at).toBe("");
  });

  it("should handle all null optional fields", () => {
    const row = {
      id: "test-id",
      userId: "user-id",
      title: "Test Playlist",
      imagePath: null,
      isPublic: null,
      createdAt: null,
    };

    const result = mapPlaylistRowToPlaylist(row);

    expect(result).toEqual({
      id: "test-id",
      user_id: "user-id",
      title: "Test Playlist",
      image_path: undefined,
      is_public: false,
      created_at: "",
    });
  });
});
