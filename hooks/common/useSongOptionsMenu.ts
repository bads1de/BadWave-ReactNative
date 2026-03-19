import { useCallback, useEffect, useRef, useState } from "react";
import Song from "@/types";

const OPEN_DELAY_MS = 10;
const CLOSE_DELAY_MS = 300;

export function useSongOptionsMenu() {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSongOptionsVisible, setIsSongOptionsVisible] = useState(false);
  const openTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPendingTimeouts = useCallback(() => {
    if (openTimeoutRef.current) {
      clearTimeout(openTimeoutRef.current);
      openTimeoutRef.current = null;
    }

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, [clearPendingTimeouts]);

  const openSongOptions = useCallback(
    (song: Song) => {
      clearPendingTimeouts();
      setSelectedSong(song);

      openTimeoutRef.current = setTimeout(() => {
        setIsSongOptionsVisible(true);
        openTimeoutRef.current = null;
      }, OPEN_DELAY_MS);
    },
    [clearPendingTimeouts],
  );

  const closeSongOptions = useCallback(() => {
    clearPendingTimeouts();
    setIsSongOptionsVisible(false);

    closeTimeoutRef.current = setTimeout(() => {
      setSelectedSong(null);
      closeTimeoutRef.current = null;
    }, CLOSE_DELAY_MS);
  }, [clearPendingTimeouts]);

  return {
    selectedSong,
    isSongOptionsVisible,
    openSongOptions,
    closeSongOptions,
  };
}

export default useSongOptionsMenu;
