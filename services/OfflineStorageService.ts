import * as FileSystem from "expo-file-system";
import { MMKV } from "react-native-mmkv";
import Song from "../types";

/**
 * オフライン再生のためのストレージサービス
 * 曲のダウンロード、削除、メタデータの管理を行う
 */
export class OfflineStorageService {
  private storage: MMKV;
  private readonly METADATA_PREFIX = "song-metadata:";
  private readonly DOWNLOAD_DIR = FileSystem.documentDirectory + "downloads/";

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
      const dirInfo = await FileSystem.getInfoAsync(this.DOWNLOAD_DIR);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.DOWNLOAD_DIR, {
          intermediates: true,
        });
      }
    } catch (error) {
      console.error("Failed to create download directory:", error);
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
      // ファイル名にはタイトルを使用（特殊文字を除去）
      const sanitizedTitle = song.title.replace(/[^a-zA-Z0-9]/g, "_");

      // 保存先のローカルパスを作成
      const localPath = `${this.DOWNLOAD_DIR}${sanitizedTitle}.mp3`;

      // 既にダウンロード済みかチェック
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists) {
        console.log(`Song already downloaded: ${song.title}`);
        return { success: true };
      }

      // ダウンロード実行
      const downloadResult = await FileSystem.downloadAsync(
        song.song_path,
        localPath
      );

      if (downloadResult.status === 200) {
        // ダウンロード成功時、メタデータを作成
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

        // メタデータを保存
        this.storage.set(
          `${this.METADATA_PREFIX}${song.id}`,
          JSON.stringify(metadata)
        );

        return { success: true };
      } else {
        console.error(
          `Download failed with status code: ${downloadResult.status}`
        );

        return {
          success: false,
          error: `Download failed with status code: ${downloadResult.status}`,
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
      // メタデータのキーを生成
      const metadataKey = `${this.METADATA_PREFIX}${songId}`;

      // メタデータを取得
      const metadataStr = this.storage.getString(metadataKey);

      if (!metadataStr) {
        // メタデータが存在しない場合は成功とみなす
        return { success: true };
      }

      const metadata = JSON.parse(metadataStr);
      const localPath = metadata.localPath;

      // ファイルが存在するか確認
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists) {
        try {
          // ファイル削除
          await FileSystem.deleteAsync(localPath);
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
      // すべてのキーを取得
      const allKeys = this.storage.getAllKeys() || [];

      // 曲のメタデータのキーだけを抽出
      const metadataKeys = allKeys.filter((key) =>
        key.startsWith(this.METADATA_PREFIX)
      );

      const songs: Song[] = [];

      // 各メタデータについて処理
      for (const key of metadataKeys) {
        const metadataStr = this.storage.getString(key);

        if (metadataStr) {
          const metadata = JSON.parse(metadataStr);

          // 実際にファイルが存在するか確認
          const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);

          if (fileInfo.exists) {
            // 存在すればリストに追加
            songs.push({
              id: metadata.id,
              title: metadata.title,
              author: metadata.author,
              image_path: metadata.image_path,
              song_path: metadata.localPath, // ローカルパスを設定
              user_id: metadata.user_id || "offline-user",
              created_at: metadata.created_at || new Date().toISOString(),
            });
          } else {
            // ファイルがなければメタデータを削除
            this.storage.delete(key);
          }
        }
      }

      return songs;
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
      // メタデータのキーを生成
      const metadataKey = `${this.METADATA_PREFIX}${songId}`;

      // メタデータが存在するか確認
      const hasMetadata = this.storage.contains(metadataKey);

      if (!hasMetadata) {
        return false;
      }

      // メタデータを取得
      const metadataStr = this.storage.getString(metadataKey);

      if (!metadataStr) {
        return false;
      }

      const metadata = JSON.parse(metadataStr);

      // ファイルが存在するか確認
      const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);
      return fileInfo.exists;
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
      // メタデータのキーを生成
      const metadataKey = `${this.METADATA_PREFIX}${songId}`;

      // メタデータを取得
      const metadataStr = this.storage.getString(metadataKey);

      if (!metadataStr) {
        return null;
      }

      const metadata = JSON.parse(metadataStr);

      // localPathが存在しない場合はnullを返す
      if (!metadata.localPath) {
        return null;
      }

      // ファイルが存在するか確認
      const fileInfo = await FileSystem.getInfoAsync(metadata.localPath);

      return fileInfo.exists ? metadata.localPath : null;
    } catch (error) {
      console.error("Error getting song local path:", error);

      return null;
    }
  }

  /**
   * すべてのダウンロード済み曲を削除
   * @returns 削除結果
   */
  async clearAllDownloads(): Promise<{ success: boolean; error?: string }> {
    try {
      // すべてのダウンロード済み曲を取得
      const songs = await this.getDownloadedSongs();

      // 各曲を削除
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
