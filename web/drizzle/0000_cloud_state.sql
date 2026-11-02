CREATE TABLE `telurfarm_state` (
  `user_id` text PRIMARY KEY NOT NULL,
  `revision` integer NOT NULL DEFAULT 1,
  `data_json` text NOT NULL,
  `updated_at` text NOT NULL
);
