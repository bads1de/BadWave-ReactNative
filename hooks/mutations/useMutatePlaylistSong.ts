import { useMutation, useQueryClient } from "@tanstack/react-query";
import addPlaylistSong from "@/actions/playlist/addPlaylistSong";
import deletePlaylistSong from "@/actions/playlist/deletePlaylistSong";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import {
  AUTH_ERRORS,
  PLAYLIST_ERRORS,
} from "@/constants/errorMessages";
import Song from "@/types";

/**
 * playlistSongs キャッシュキーを生成する
 */
const playlistSongsKey = (playlistId: string) => [
  CACHED_QUERIES.playlistSongs,
  playlistId,
];

/**
 * プレイリスト曲の操作（追加・削除）を行うカスタムフック
 * オンライン時のみ操作可能。Supabase と SQLite の両方に書き込む。
 *
 * 楽観的更新は playlistSongs キャッシュ (Song[]) に対して行われる。
 * 追加時は呼び出し元から実 Song オブジェクトを受け取り、それを挿入する
 * （プレースホルダーオブジェクトは SongItem の描画を壊すため使わない）。
 *
 * @param userId ユーザーID
 */
export function useMutatePlaylistSong(userId?: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  /** 操作前のキャッシュをスナップショットとして保存する */
  const snapshotSongs = async (playlistId: string) => {
    await queryClient.cancelQueries({
      queryKey: playlistSongsKey(playlistId),
    });
    return queryClient.getQueryData<Song[]>(playlistSongsKey(playlistId));
  };

  /** 失敗時にキャッシュをロールバックする */
  const rollbackSongs = (
    playlistId: string,
    previousSongs: Song[] | undefined
  ) => {
    queryClient.setQueryData(playlistSongsKey(playlistId), previousSongs);
  };

  /** 成功時に関連クエリを無効化する */
  const invalidateRelatedQueries = (playlistId: string, songId: string) => {
    queryClient.invalidateQueries({
      queryKey: playlistSongsKey(playlistId),
    });
    queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.playlists],
    });
    queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.playlistStatus, songId],
    });
  };

  /** userId / オンライン状態の共通バリデーション */
  const validatePreconditions = () => {
    if (!userId) {
      throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
    }
    if (!isOnline) {
      throw new Error(PLAYLIST_ERRORS.EDIT_OFFLINE);
    }
  };

  /**
   * プレイリストに曲を追加
   */
  const addSong = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
    }: {
      songId: string;
      playlistId: string;
      song?: Song;
    }) => {
      validatePreconditions();

      // 追加処理は action に一本化し、Supabase / SQLite / 画像更新を揃える
      await addPlaylistSong({ playlistId, userId: userId!, songId });

      return { songId, playlistId };
    },
    // 楽観的更新（実 Song が渡された場合のみキャッシュに挿入）
    onMutate: async ({ playlistId, song }) => {
      const previousSongs = await snapshotSongs(playlistId);

      if (song) {
        queryClient.setQueryData<Song[]>(playlistSongsKey(playlistId), (old) =>
          old ? [...old, song] : old
        );
      }

      return { previousSongs };
    },
    onSuccess: (_data, variables) => {
      invalidateRelatedQueries(variables.playlistId, variables.songId);
    },
    onError: (error, variables, context) => {
      if (context?.previousSongs) {
        rollbackSongs(variables.playlistId, context.previousSongs);
      }
      console.error(PLAYLIST_ERRORS.ADD_SONG_FAILED, error);
    },
  });

  /**
   * プレイリストから曲を削除
   */
  const removeSong = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
    }: {
      songId: string;
      playlistId: string;
    }) => {
      validatePreconditions();

      // 削除処理は action に一本化し、Supabase / SQLite を揃える
      await deletePlaylistSong(playlistId, songId, userId!);

      return { songId, playlistId };
    },
    // 楽観的更新
    onMutate: async ({ songId, playlistId }) => {
      const previousSongs = await snapshotSongs(playlistId);

      queryClient.setQueryData<Song[]>(playlistSongsKey(playlistId), (old) =>
        (old ?? []).filter((cached) => cached.id !== songId)
      );

      return { previousSongs };
    },
    onSuccess: (_data, variables) => {
      invalidateRelatedQueries(variables.playlistId, variables.songId);
    },
    onError: (error, variables, context) => {
      if (context?.previousSongs) {
        rollbackSongs(variables.playlistId, context.previousSongs);
      }
      console.error(PLAYLIST_ERRORS.REMOVE_SONG_FAILED, error);
    },
  });

  return {
    addSong,
    removeSong,
  };
}

export default useMutatePlaylistSong;

