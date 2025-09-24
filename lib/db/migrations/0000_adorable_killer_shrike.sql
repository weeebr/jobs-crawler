CREATE TABLE `analysis_feedback` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`analysis_record_id` integer NOT NULL,
	`missing_skills` text,
	`missing_experience` text,
	`missing_keywords` text,
	`skill_recommendations` text,
	`experience_recommendations` text,
	`project_recommendations` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`analysis_record_id`) REFERENCES `analysis_records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `analysis_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`title` text NOT NULL,
	`company` text NOT NULL,
	`description` text,
	`published_at` text,
	`location` text,
	`workload` text,
	`duration` text,
	`size` text,
	`company_size` text,
	`stack` text NOT NULL,
	`match_score` real NOT NULL,
	`reasoning` text NOT NULL,
	`status` text,
	`is_new_this_run` integer DEFAULT false NOT NULL,
	`source_url` text,
	`source_type` text,
	`model_used` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `cv_profiles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text,
	`email` text,
	`roles` text NOT NULL,
	`skills` text NOT NULL,
	`projects` text NOT NULL,
	`education` text NOT NULL,
	`keywords` text NOT NULL,
	`is_active` integer DEFAULT true,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `job_searches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer NOT NULL,
	`search_url` text NOT NULL,
	`total_jobs_found` integer,
	`successfully_analyzed` integer DEFAULT 0,
	`failed_analyses` integer DEFAULT 0,
	`status` text DEFAULT 'running',
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` integer NOT NULL,
	`api_key_hash` text NOT NULL,
	`last_active_at` integer NOT NULL,
	`total_analyses` integer DEFAULT 0,
	`preferred_model` text DEFAULT 'gpt-4o-mini'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_api_key_hash_unique` ON `users` (`api_key_hash`);