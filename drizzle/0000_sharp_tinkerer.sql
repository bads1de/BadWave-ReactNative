CREATE TABLE `liked_songs` (
	`user_id` text NOT NULL,
	`song_id` text NOT NULL,
	`liked_at` text DEFAULT 'now',
	PRIMARY KEY(`user_id`, `song_id`),
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlist_songs` (
	`id` text PRIMARY KEY NOT NULL,
	`playlist_id` text NOT NULL,
	`song_id` text NOT NULL,
	`added_at` text,
	FOREIGN KEY (`playlist_id`) REFERENCES `playlists`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`song_id`) REFERENCES `songs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `playlists` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`image_path` text,
	`is_public` integer DEFAULT false,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `section_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`item_ids` text,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `songs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`song_path` text,
	`image_path` text,
	`video_path` text,
	`original_song_path` text,
	`original_image_path` text,
	`original_video_path` text,
	`duration` real,
	`genre` text,
	`lyrics` text,
	`created_at` text,
	`downloaded_at` integer,
	`last_played_at` integer,
	`play_count` integer DEFAULT 0,
	`like_count` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE `spotlights` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`author` text NOT NULL,
	`description` text,
	`genre` text,
	`original_video_path` text,
	`original_thumbnail_path` text,
	`video_path` text,
	`thumbnail_path` text,
	`created_at` text,
	`downloaded_at` integer
);
