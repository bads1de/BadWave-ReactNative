import RNFS from "react-native-fs";
import { MMKV } from "react-native-mmkv";
import Song from "../types";

/**
 * オフライン再生のためのストレージサービス
 * 曲のダウンロード、削除、メタデータの管理を行う
 */
export class OfflineStorageService {
  private storage: MMKV;
  private readonly METADATA_PREFIX = "song-metadata:";
  private readonly DOWNLOAD_DIR = RNFS.DocumentDirectoryPath + "/downloads/";

  constructor() {
    this.storage = new MMKV({
      id: "offline-storage",
    });
    this.ensureDownloadDirectory();
  }

  /**
   * ダウンロードディレクトリが存在することを確認
   */
  private async ensureDownloadDirectory(): Promise<void> {
    try {
      console.log("[DEBUG] Checking download directory:", this.DOWNLOAD_DIR);
      const exists = await RNFS.exists(this.DOWNLOAD_DIR);
      console.log("[DEBUG] Download directory exists:", exists);
      if (!exists && RNFS.mkdir) {
        console.log("[DEBUG] Creating download directory");
        await RNFS.mkdir(this.DOWNLOAD_DIR);
        console.log("[DEBUG] Download directory created successfully");
      }
    } catch (error) {
      console.error("[ERROR] Failed to create download directory:", error);
    }
  }

  /**
   * 曲をダウンロードし、メタデータを保存
   * @param song ダウンロードする曲
   * @returns ダウンロード結果
   */
  async downloadSong(
    song: Song
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[DEBUG] Starting download for song:", song.title, song.id);
      // ファイル名にはタイトルを使用（特殊文字を除去）
      const sanitizedTitle = song.title.replace(/[^a-zA-Z0-9]/g, "_");
      const localPath = `${this.DOWNLOAD_DIR}${sanitizedTitle}.mp3`;
      console.log("[DEBUG] Local path for download:", localPath);

      // 既にダウンロード済みかチェック
      const exists = await RNFS.exists(localPath);
      console.log("[DEBUG] Song already exists locally:", exists);
      if (exists) {
        console.log(`[DEBUG] Song already downloaded: ${song.title}`);
        return { success: true };
      }

      // ダウンロード実行
      console.log("[DEBUG] Starting download from URL:", song.song_path);
      const downloadResult = await RNFS.downloadFile({
        fromUrl: song.song_path,
        toFile: localPath,
        background: true,
        discretionary: true,
      }).promise;

      console.log("[DEBUG] Download result:", downloadResult);
      if (downloadResult.statusCode === 200) {
        console.log("[DEBUG] Download completed successfully");
        // メタデータを保存
        const metadata = {
          id: song.id,
          title: song.title,
          author: song.author,
          image_path: song.image_path,
          user_id: song.user_id,
          created_at: song.created_at,
          localPath,
          downloadDate: new Date().toISOString(),
        };

        const metadataKey = `${this.METADATA_PREFIX}${song.id}`;
        console.log("[DEBUG] Saving metadata with key:", metadataKey);
        this.storage.set(metadataKey, JSON.stringify(metadata));
        console.log("[DEBUG] Metadata saved successfully");

        return { success: true };
      } else {
        console.log(
          "[ERROR] Download failed with status code:",
          downloadResult.statusCode
        );
        return {
          success: false,
          error: `Download failed with status code: ${downloadResult.statusCode}`,
        };
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
   * ダウンロードした曲を削除
   * @param songId 削除する曲のID
   * @returns 削除結果
   */
  async deleteSong(
    songId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const metadataKey = `${this.METADATA_PREFIX}${songId}`;
      const metadataStr = this.storage.getString(metadataKey);

      if (!metadataStr) {
        return { success: true }; // メタデータが存在しない場合は成功とみなす
      }

      const metadata = JSON.parse(metadataStr);
      const localPath = metadata.localPath;

      // ファイルが存在するか確認
      const exists = await RNFS.exists(localPath);
      if (exists) {
        try {
          // ファイル削除
          await RNFS.unlink(localPath);
        } catch (unlinkError) {
          console.error("Error unlinking file:", unlinkError);
          return {
            success: false,
            error:
              unlinkError instanceof Error
                ? unlinkError.message
                : String(unlinkError),
          };
        }
      }

      // メタデータ削除
      this.storage.delete(metadataKey);

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
   * @returns ダウンロード済みの曲一覧
   */
  async getDownloadedSongs(): Promise<Song[]> {
    try {
      console.log("[DEBUG] Getting all downloaded songs");
      const allKeys = this.storage.getAllKeys() || [];
      console.log("[DEBUG] All storage keys:", allKeys);
      const metadataKeys = allKeys.filter((key) =>
        key.startsWith(this.METADATA_PREFIX)
      );
      console.log("[DEBUG] Filtered metadata keys:", metadataKeys);

      const songs: Song[] = [];

      for (const key of metadataKeys) {
        console.log("[DEBUG] Processing metadata key:", key);
        const metadataStr = this.storage.getString(key);
        if (metadataStr) {
          console.log(
            "[DEBUG] Metadata found:",
            metadataStr.substring(0, 100) + "..."
          );
          const metadata = JSON.parse(metadataStr);

          // ファイルが実際に存在するか確認
          console.log(
            "[DEBUG] Checking if file exists at:",
            metadata.localPath
          );
          const exists = await RNFS.exists(metadata.localPath);
          console.log("[DEBUG] File exists:", exists);
          if (exists) {
            const song = {
              id: metadata.id,
              title: metadata.title,
              author: metadata.author,
              image_path: metadata.image_path,
              song_path: metadata.localPath, // ローカルパスを設定
              user_id: metadata.user_id || "offline-user",
              created_at: metadata.created_at || new Date().toISOString(),
            };
            console.log("[DEBUG] Adding song to list:", song.title);
            songs.push(song);
          } else {
            // ファイルが存在しない場合はメタデータを削除
            console.log("[DEBUG] File not found, deleting metadata");
            this.storage.delete(key);
          }
        } else {
          console.log("[DEBUG] No metadata found for key:", key);
        }
      }

      console.log("[DEBUG] Total downloaded songs found:", songs.length);
      return songs;
    } catch (error) {
      console.error("[ERROR] Error getting downloaded songs:", error);
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
      const metadataKey = `${this.METADATA_PREFIX}${songId}`;
      const hasMetadata = this.storage.contains(metadataKey);

      if (!hasMetadata) {
        return false;
      }

      const metadataStr = this.storage.getString(metadataKey);
      if (!metadataStr) {
        return false;
      }

      const metadata = JSON.parse(metadataStr);
      return await RNFS.exists(metadata.localPath);
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
      console.log("[DEBUG] Getting local path for song ID:", songId);
      const metadataKey = `${this.METADATA_PREFIX}${songId}`;
      console.log("[DEBUG] Metadata key:", metadataKey);
      const metadataStr = this.storage.getString(metadataKey);
      console.log("[DEBUG] Metadata found:", metadataStr ? "yes" : "no");

      if (!metadataStr) {
        console.log("[DEBUG] No metadata found for song ID:", songId);
        return null;
      }

      const metadata = JSON.parse(metadataStr);
      console.log("[DEBUG] Checking if file exists at:", metadata.localPath);
      const exists = await RNFS.exists(metadata.localPath);
      console.log("[DEBUG] File exists:", exists);

      if (exists) {
        console.log("[DEBUG] Returning local path:", metadata.localPath);
        return metadata.localPath;
      } else {
        console.log("[DEBUG] File not found at path:", metadata.localPath);
        return null;
      }
    } catch (error) {
      console.error("[ERROR] Error getting song local path:", error);
      return null;
    }
  }

  /**
   * すべてのダウンロード済み曲を削除
   * @returns 削除結果
   */
  async clearAllDownloads(): Promise<{ success: boolean; error?: string }> {
    try {
      const songs = await this.getDownloadedSongs();

      for (const song of songs) {
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
