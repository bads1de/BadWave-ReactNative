import * as FileSystem from "expo-file-system";
import { eq, isNotNull } from "drizzle-orm";
import Song from "@/types";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";

/**
 * オフライン再生のためのストレージサービス
 * 曲のダウンロード、削除、メタデータの管理を行う
 * (SQLite Version)
 */
export class OfflineStorageService {
  private readonly DOWNLOAD_DIR = FileSystem.documentDirectory + "downloads/";
  private readonly IMAGES_DIR =
    FileSystem.documentDirectory + "downloads/images/";
  private readonly MINIMUM_FREE_SPACE = 50 * 1024 * 1024; // 50MB

  constructor() {
    this.ensureDownloadDirectory();
  }

  /**
   * ダウンロードディレクトリが存在することを確認
   */
  private async ensureDownloadDirectory(): Promise<void> {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.DOWNLOAD_DIR);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.DOWNLOAD_DIR, {
          intermediates: true,
        });
      }

      // 画像ディレクトリも確認
      const imagesDirInfo = await FileSystem.getInfoAsync(this.IMAGES_DIR);

      if (!imagesDirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.IMAGES_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Failed to create download directory:", error);
    }
  }

  /**
   * 画像をダウンロードし、ローカルパスを返す
   * @param imageUrl 画像のURL
   * @param songId 曲のID
   * @returns ローカルパス（失敗時はnull）
   */
  private async downloadImage(
    imageUrl: string,
    songId: string,
  ): Promise<string | null> {
    try {
      // 画像URLが空の場合はスキップ
      if (!imageUrl) {
        return null;
      }

      // 保存先のローカルパスを作成
      const localPath = `${this.IMAGES_DIR}${songId}_artwork.jpg`;

      // 既にダウンロード済みかチェック
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists) {
        console.log(`Image already downloaded: ${songId}`);
        return localPath;
      }

      // ダウンロード実行
      try {
        const downloadResult = await FileSystem.downloadAsync(
          imageUrl,
          localPath,
        );

        if (downloadResult.status === 200) {
          console.log(`Image downloaded successfully: ${songId}`);
          return localPath;
        } else {
          console.error(
            `Image download failed with status code: ${downloadResult.status}`,
          );
          // 失敗した場合は残留ファイルをクリーンアップ
          await FileSystem.deleteAsync(localPath, { idempotent: true });
          return null;
        }
      } catch (downloadError) {
        // ネットワークエラー等での中断時もクリーンアップ
        await FileSystem.deleteAsync(localPath, { idempotent: true });
        throw downloadError;
      }
    } catch (error) {
      console.error("Error downloading image:", error);
      return null;
    }
  }

  /**
   * 曲をダウンロードし、ローカルDBにパスを保存
   * @param song ダウンロードする曲
   * @returns ダウンロード結果
   */
  async downloadSong(
    song: Song,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // ダウンロード前にストレージの空き容量をチェック
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      if (freeSpace < this.MINIMUM_FREE_SPACE) {
        return {
          success: false,
          error: "Not enough free storage space.",
        };
      }

      // ファイル名にはタイトルを使用（特殊文字を除去）
      const sanitizedTitle = song.title.replace(/[^a-zA-Z0-9]/g, "_");

      // 保存先のローカルパスを作成
      const localPath = `${this.DOWNLOAD_DIR}${sanitizedTitle}.mp3`;

      // 既にダウンロード済みかチェック
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists) {
        console.log(`Song already downloaded: ${song.title}`);
        // DBの状態も念のため更新
        await this.updateSongPathInDb(song.id, localPath, null);
        return { success: true };
      }

      // ダウンロード実行
      try {
        const downloadResult = await FileSystem.downloadAsync(
          song.song_path,
          localPath,
        );

        if (downloadResult.status === 200) {
          // 画像もダウンロード
          const imageLocalPath = await this.downloadImage(
            song.image_path,
            song.id,
          );

          // SQLite にローカルパスを保存
          await this.updateSongPathInDb(song.id, localPath, imageLocalPath);

          return { success: true };
        } else {
          console.error(
            `Download failed with status code: ${downloadResult.status}`,
          );

          // 失敗した場合は残留ファイルをクリーンアップ
          await FileSystem.deleteAsync(localPath, { idempotent: true });

          return {
            success: false,
            error: `Download failed with status code: ${downloadResult.status}`,
          };
        }
      } catch (downloadError) {
        // ネットワークエラー等での中断時もクリーンアップ
        await FileSystem.deleteAsync(localPath, { idempotent: true });
        throw downloadError;
      }
    } catch (error) {
      console.error("Error downloading song:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * SQLite の曲情報を更新するためのヘルパー
   */
  private async updateSongPathInDb(
    songId: string,
    songPath: string | null,
    imagePath: string | null,
  ) {
    try {
      const updateData: any = {
        songPath: songPath,
        downloadedAt: songPath ? new Date() : null,
      };

      if (imagePath) {
        updateData.imagePath = imagePath;
      } else if (songPath === null) {
        // 削除時は画像パスも消す
        updateData.imagePath = null;
      }

      await db.update(songs).set(updateData).where(eq(songs.id, songId));
    } catch (error) {
      console.error("Failed to update song path in DB:", error);
      throw error;
    }
  }

  /**
   * ダウンロードした曲を削除
   * @param songId 削除する曲のID
   * @returns 削除結果
   */
  async deleteSong(
    songId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // SQLite からパスを取得
      const localPath = await this.getSongLocalPath(songId);

      if (!localPath) {
        // パスがない（既に削除済みか未ダウンロード）場合は成功とみなすが、
        // DBの状態整合性のため更新処理は走らせる
        await this.updateSongPathInDb(songId, null, null);
        return { success: true };
      }

      // ファイルが存在するか確認
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists) {
        try {
          // ファイル削除
          await FileSystem.deleteAsync(localPath);
        } catch (unlinkError) {
          console.error("Error unlinking file:", unlinkError);
          // ファイル削除に失敗してもDBは更新すべきか？ -> 整合性が取れなくなるのでエラーを返す
          return {
            success: false,
            error:
              unlinkError instanceof Error
                ? unlinkError.message
                : String(unlinkError),
          };
        }
      }

      // 関連する画像ファイルも削除（ベストエフォート）
      const imagePath = await this.getImageLocalPath(songId);
      if (imagePath) {
        const imageInfo = await FileSystem.getInfoAsync(imagePath);
        if (imageInfo.exists) {
          await FileSystem.deleteAsync(imagePath).catch(() => {});
        }
      }

      // SQLite のローカルパス情報をクリア
      await this.updateSongPathInDb(songId, null, null);

      return { success: true };
    } catch (error) {
      console.error("Error deleting song:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * ダウンロード済みの曲一覧を取得
   * SQLite から songPath が設定されている曲を返す
   * @returns ダウンロード済みの曲一覧
   */
  async getDownloadedSongs(): Promise<Song[]> {
    try {
      const sqliteResults = await db
        .select()
        .from(songs)
        .where(isNotNull(songs.songPath));

      const downloadedSongs: Song[] = [];

      for (const row of sqliteResults) {
        if (row.songPath) {
          // パフォーマンス改善（N+1問題の解消）のため、
          // FileSystem.getInfoAsyncによる実ファイルチェックは省略し、
          // SQLiteの情報を「真」として扱う（再生時等の呼び出し元でファイルが無ければ対処する方針）
          downloadedSongs.push({
            id: row.id,
            title: row.title,
            author: row.author,
            image_path: row.imagePath ?? row.originalImagePath ?? "",
            song_path: row.songPath,
            user_id: row.userId,
            created_at: row.createdAt ?? "",
          });
        }
      }

      return downloadedSongs;
    } catch (error) {
      console.error("Error getting downloaded songs:", error);
      return [];
    }
  }

  /**
   * 曲がダウンロード済みかどうかを確認
   * @param songId 確認する曲のID
   * @returns ダウンロード済みならtrue
   */
  async isSongDownloaded(songId: string): Promise<boolean> {
    try {
      const localPath = await this.getSongLocalPath(songId);
      return localPath !== null;
    } catch (error) {
      console.error("Error checking if song is downloaded:", error);
      return false;
    }
  }

  /**
   * 曲のローカルパスを取得
   * @param songId 曲のID
   * @returns ローカルパス（存在しない場合はnull）
   */
  async getSongLocalPath(songId: string): Promise<string | null> {
    try {
      const sqliteResult = await db
        .select({ songPath: songs.songPath })
        .from(songs)
        .where(eq(songs.id, songId))
        .limit(1);

      if (sqliteResult.length > 0 && sqliteResult[0].songPath) {
        // パフォーマンス改善のため、実ファイルチェックは省略しDBの値を信頼する
        return sqliteResult[0].songPath;
      }
      return null;
    } catch (error) {
      console.error("Error getting song local path:", error);
      return null;
    }
  }

  /**
   * 画像のローカルパスを取得（内部用）
   */
  private async getImageLocalPath(songId: string): Promise<string | null> {
    try {
      const sqliteResult = await db
        .select({ imagePath: songs.imagePath })
        .from(songs)
        .where(eq(songs.id, songId))
        .limit(1);

      if (sqliteResult.length > 0) {
        return sqliteResult[0].imagePath;
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * ダウンロード済み楽曲の合計サイズを取得（バイト単位）
   * @returns ダウンロード済み楽曲と画像の合計サイズ
   */
  async getDownloadedSongsSize(): Promise<number> {
    try {
      // SQLiteからsongPathが設定されている曲を取得
      const sqliteResults = await db
        .select({
          songPath: songs.songPath,
          imagePath: songs.imagePath,
        })
        .from(songs)
        .where(isNotNull(songs.songPath));

      let totalSize = 0;

      for (const row of sqliteResults) {
        // 曲ファイルのサイズを取得
        if (row.songPath) {
          const songInfo = await FileSystem.getInfoAsync(row.songPath);
          if (songInfo.exists && "size" in songInfo) {
            totalSize += songInfo.size;
          }
        }

        // 画像ファイルのサイズを取得
        if (row.imagePath) {
          const imageInfo = await FileSystem.getInfoAsync(row.imagePath);
          if (imageInfo.exists && "size" in imageInfo) {
            totalSize += imageInfo.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error("Error getting downloaded songs size:", error);
      return 0;
    }
  }

  /**
   * すべてのダウンロード済み曲を削除
   * @returns 削除結果
   */
  async clearAllDownloads(): Promise<{ success: boolean; error?: string }> {
    try {
      const songsList = await this.getDownloadedSongs();

      for (const song of songsList) {
        await this.deleteSong(song.id);
      }

      return { success: true };
    } catch (error) {
      console.error("Error clearing all downloads:", error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
