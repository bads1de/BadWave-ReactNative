import * as FileSystem from "expo-file-system/legacy";
import Song from "@/types";
import { getErrorMessage } from "@/lib/utils/error";
import getLocalPaths from "@/actions/download/getLocalPaths";
import getSongPathsBatch from "@/actions/download/getSongPathsBatch";
import type { SongPathInfo } from "@/actions/download/getSongPathsBatch";
import getDownloadedSongsFromDb from "@/actions/download/getDownloadedSongs";
import getDownloadedFiles from "@/actions/download/getDownloadedFiles";
import setLocalPaths from "@/actions/download/setLocalPaths";
import clearLocalPaths from "@/actions/download/clearLocalPaths";

/**
 * ファイル操作を一度に実行する件数。
 * ダウンロード済み曲が多い環境で、ネイティブの FileSystem 呼び出しを
 * 無制限に並列実行しないための上限。
 */
const FILE_IO_CONCURRENCY = 20;

async function runInChunks<T, R>(
  items: T[],
  task: (item: T) => Promise<R>,
  concurrency = FILE_IO_CONCURRENCY,
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    results.push(...(await Promise.all(chunk.map(task))));
  }

  return results;
}

/**
 * オフライン再生のためのストレージサービス
 * ファイルのダウンロード・削除・容量チェックを担当する。
 *
 * DB (SQLite) への読み書きは actions/download/ に委譲し、
 * このサービスは FileSystem 操作とその組み立てに専念する。
 */
export class OfflineStorageService {
  private readonly DOWNLOAD_DIR = FileSystem.documentDirectory + "downloads/";
  private readonly IMAGES_DIR =
    FileSystem.documentDirectory + "downloads/images/";
  private readonly MINIMUM_FREE_SPACE = 50 * 1024 * 1024; // 50MB

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
      await this.ensureDownloadDirectory();

      // 旧バージョンでタイトル名から保存した既存ファイルも再利用する
      const existingPaths = await getLocalPaths(song.id);
      if (existingPaths.songPath) {
        const existingInfo = await FileSystem.getInfoAsync(
          existingPaths.songPath,
        );
        if (existingInfo.exists) {
          console.log(`Song already downloaded: ${song.title}`);
          return { success: true };
        }
      }

      // ファイル名には曲IDを使用する（同名タイトルの曲が上書きされるのを防ぐ）
      const sanitizedId = song.id.replace(/[^a-zA-Z0-9_-]/g, "_");
      const localPath = `${this.DOWNLOAD_DIR}${sanitizedId}.mp3`;

      // 既にダウンロード済みかチェック
      const fileInfo = await FileSystem.getInfoAsync(localPath);

      if (fileInfo.exists) {
        console.log(`Song already downloaded: ${song.title}`);
        // DBの状態も念のため更新
        await setLocalPaths({
          songId: song.id,
          songPath: localPath,
          imagePath: null,
        });
        return { success: true };
      }

      // 新規ダウンロードの前にストレージの空き容量をチェック
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      if (freeSpace < this.MINIMUM_FREE_SPACE) {
        return {
          success: false,
          error: "Not enough free storage space.",
        };
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
          await setLocalPaths({
            songId: song.id,
            songPath: localPath,
            imagePath: imageLocalPath,
          });

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
        error: getErrorMessage(error),
      };
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
      const { songPath, imagePath } = await getLocalPaths(songId);

      if (songPath) {
        const fileInfo = await FileSystem.getInfoAsync(songPath);

        if (fileInfo.exists) {
          try {
            await FileSystem.deleteAsync(songPath);
          } catch (unlinkError) {
            console.error("Error unlinking file:", unlinkError);
            // ファイル削除に失敗した場合はDBを更新せずエラーを返す
            return {
              success: false,
              error: getErrorMessage(unlinkError),
            };
          }
        }
      }

      // 関連する画像ファイルも削除（ベストエフォート）
      if (imagePath) {
        const imageInfo = await FileSystem.getInfoAsync(imagePath);
        if (imageInfo.exists) {
          await FileSystem.deleteAsync(imagePath).catch(() => {});
        }
      }

      // SQLite のローカルパス情報をクリア
      await clearLocalPaths([songId]);

      return { success: true };
    } catch (error) {
      console.error("Error deleting song:", error);

      return {
        success: false,
        error: getErrorMessage(error),
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
      // パフォーマンス改善（N+1問題の解消）のため、
      // FileSystem.getInfoAsyncによる実ファイルチェックは省略し、
      // SQLiteの情報を「真」として扱う（再生時等の呼び出し元でファイルが無ければ対処する方針）
      return await getDownloadedSongsFromDb();
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
      const { songPath } = await getLocalPaths(songId);
      return songPath !== null;
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
      const { songPath } = await getLocalPaths(songId);
      return songPath;
    } catch (error) {
      console.error("Error getting song local path:", error);
      return null;
    }
  }

  /**
   * 複数曲のパス情報を一括取得する（N+1クエリの回避）
   * @param songIds 取得対象の曲ID配列
   * @returns songId をキーに { localPath, originalPath } を持つMap
   */
  async getSongPathsBatch(
    songIds: string[],
  ): Promise<Map<string, SongPathInfo>> {
    try {
      return await getSongPathsBatch(songIds);
    } catch (error) {
      console.error("Error getting song paths batch:", error);
      return new Map();
    }
  }

  /**
   * ダウンロード済み楽曲の合計サイズを取得（バイト単位）
   * @returns ダウンロード済み楽曲と画像の合計サイズ
   */
  async getDownloadedSongsSize(): Promise<number> {
    try {
      const files = await getDownloadedFiles();

      const paths = files.flatMap(({ songPath, imagePath }) =>
        [songPath, imagePath].filter((path): path is string => Boolean(path)),
      );

      const sizes = await runInChunks(paths, async (path) => {
        try {
          const fileInfo = await FileSystem.getInfoAsync(path);
          return fileInfo.exists && "size" in fileInfo ? fileInfo.size : 0;
        } catch (error) {
          // 1ファイルの情報取得失敗で合計値全体を失わないようにする
          console.error(`Error getting file info: ${path}`, error);
          return 0;
        }
      });

      return sizes.reduce((total, size) => total + size, 0);
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
      const files = await getDownloadedFiles();

      // 曲本体の削除に失敗したものは DB をクリアせず、次回に再試行できるようにする
      const results = await runInChunks(files, async (file) => {
        try {
          if (file.songPath) {
            await FileSystem.deleteAsync(file.songPath);
          }
          if (file.imagePath) {
            await FileSystem.deleteAsync(file.imagePath).catch(() => {});
          }
          return { id: file.id, error: null };
        } catch (error) {
          return { id: file.id, error };
        }
      });

      const clearedIds = results
        .filter((result) => result.error === null)
        .map((result) => result.id);

      await clearLocalPaths(clearedIds);

      const failure = results.find((result) => result.error !== null);
      if (failure) {
        return {
          success: false,
          error: getErrorMessage(failure.error),
        };
      }

      return { success: true };
    } catch (error) {
      console.error("Error clearing all downloads:", error);

      return {
        success: false,
        error: getErrorMessage(error),
      };
    }
  }
}
