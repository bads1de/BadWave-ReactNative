CREATE INDEX `playlist_songs_playlist_id_idx` ON `playlist_songs` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `playlist_songs_song_id_idx` ON `playlist_songs` (`song_id`);--> statement-breakpoint
CREATE INDEX `songs_user_id_idx` ON `songs` (`user_id`);--> statement-breakpoint
CREATE INDEX `songs_genre_idx` ON `songs` (`genre`);--> statement-breakpoint
CREATE INDEX `songs_play_count_idx` ON `songs` (`play_count`);--> statement-breakpoint
CREATE INDEX `songs_like_count_idx` ON `songs` (`like_count`);