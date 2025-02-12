import getSongs from "@/actions/getSongs";
import { supabase } from "@/lib/supabase";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

describe("getSongs", () => {
  it("should fetch songs from the database", async () => {
    const songs = await getSongs();

    // 取得したデータが配列であることを確認
    expect(Array.isArray(songs)).toBe(true);

    // 必要に応じて、取得したデータの件数や内容をチェック
    // 例: 少なくとも1件以上のデータが取得できているか
    expect(songs.length).toBeGreaterThan(0);

    // 例: 取得したデータの各要素が期待する構造を持っているか
    songs.forEach((song) => {
      expect(song).toHaveProperty("id");
      expect(song).toHaveProperty("user_id");
      expect(song).toHaveProperty("title");
      expect(song).toHaveProperty("author");
      expect(song).toHaveProperty("song_path");
      expect(song).toHaveProperty("image_path");
      expect(song).toHaveProperty("created_at");
    });
  });

  it("should return an empty array if there is an error", async () => {
    // エラーを発生させるためのモック (Supabase クライアントの from メソッドをモック)

    const mockSupabase = {
      from: () => ({
        select: () => ({
          order: () => ({
            data: null,
            error: { message: "Test error" },
          }),
        }),
      }),
    };
    jest.spyOn(supabase, "from").mockImplementation(mockSupabase.from as any);

    const songs = await getSongs();
    expect(songs).toEqual([]);
  });
});
