import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import deletePlaylist from "@/actions/playlist/deletePlaylist";
import renamePlaylist from "@/actions/playlist/renamePlaylist";
import togglePublicPlaylist from "@/actions/playlist/togglePublicPlaylist";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

interface TogglePublicVariables {
  playlistId: string;
  isPublic: boolean;
}

interface RenamePlaylistVariables {
  playlistId: string;
  title: string;
}

interface DeletePlaylistVariables {
  playlistId: string;
}

export function useMutatePlaylist(userId?: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  const togglePublic = useMutation({
    mutationFn: async ({ playlistId, isPublic }: TogglePublicVariables) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(PLAYLIST_ERRORS.EDIT_OFFLINE);
      }

      await togglePublicPlaylist(playlistId, userId, isPublic);
      return { playlistId };
    },
    onSuccess: ({ playlistId }) => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistById, playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getPublicPlaylists],
      });
    },
  });

  const rename = useMutation({
    mutationFn: async ({ playlistId, title }: RenamePlaylistVariables) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(PLAYLIST_ERRORS.EDIT_OFFLINE);
      }

      await renamePlaylist(playlistId, title, userId);
      return { playlistId };
    },
    onSuccess: ({ playlistId }) => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistById, playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getPublicPlaylists],
      });
    },
  });

  const remove = useMutation({
    mutationFn: async ({ playlistId }: DeletePlaylistVariables) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(PLAYLIST_ERRORS.EDIT_OFFLINE);
      }

      await deletePlaylist(playlistId, userId);
      return { playlistId };
    },
    onSuccess: ({ playlistId }) => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistById, playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getPublicPlaylists],
      });
    },
  });

  return {
    togglePublic,
    rename,
    remove,
  };
}

export default useMutatePlaylist;
