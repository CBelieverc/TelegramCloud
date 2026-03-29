DROP TABLE IF EXISTS `settings`;
--> statement-breakpoint
DROP TABLE IF EXISTS `files`;
--> statement-breakpoint
DROP TABLE IF EXISTS `folders`;
--> statement-breakpoint
DROP TABLE IF EXISTS `users`;
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`telegram_user_id` text,
	`telegram_group_chat_id` text,
	`registration_code` text,
	`bot_username` text,
	`linked_at` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`parent_id` integer,
	`created_at` integer
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`name` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`telegram_file_id` text NOT NULL,
	`telegram_message_id` integer NOT NULL,
	`folder_id` integer,
	`created_at` integer
);
