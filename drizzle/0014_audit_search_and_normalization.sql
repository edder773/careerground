CREATE VIRTUAL TABLE `workspace_search` USING fts5(
  `kind` UNINDEXED,
  `entity_id` UNINDEXED,
  `owner_id` UNINDEXED,
  `title`,
  `body`,
  tokenize = 'unicode61 remove_diacritics 2'
);--> statement-breakpoint

INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
SELECT 'folders', `id`, `user_id`, `name`, '' FROM `collections` WHERE `deleted_at` IS NULL;--> statement-breakpoint
INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
SELECT 'notes', `id`, `user_id`, `title`, `markdown` FROM `notes` WHERE `deleted_at` IS NULL;--> statement-breakpoint
INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
SELECT 'jobs', `id`, '', `company_name` || ' ' || `title`, `category` || ' ' || `region` || ' ' || `summary` || ' ' || `tech_stack`
FROM `jobs` WHERE `status` IN ('ACTIVE', 'DEADLINE_UNKNOWN');--> statement-breakpoint
INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
SELECT 'codingProblems', `id`, '', `display_title`, `tags` FROM `coding_problems` WHERE `active` = 1;--> statement-breakpoint
INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
SELECT 'solutions', `id`, `author_id`, `title`, `description` || ' ' || `lessons`
FROM `solutions` WHERE `deleted_at` IS NULL;--> statement-breakpoint
INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
SELECT 'learning', u.`id`, '', u.`title`, s.`title` || ' ' || u.`summary` || ' ' || u.`concepts`
FROM `learning_units` u JOIN `learning_sources` s ON s.`id` = u.`source_id`
WHERE u.`published` = 1;--> statement-breakpoint

CREATE TRIGGER `trg_collections_search_insert` AFTER INSERT ON `collections` WHEN NEW.`deleted_at` IS NULL BEGIN
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  VALUES ('folders', NEW.`id`, NEW.`user_id`, NEW.`name`, '');
END;--> statement-breakpoint
CREATE TRIGGER `trg_collections_search_update` AFTER UPDATE ON `collections` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'folders' AND `entity_id` = OLD.`id`;
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'folders', NEW.`id`, NEW.`user_id`, NEW.`name`, '' WHERE NEW.`deleted_at` IS NULL;
END;--> statement-breakpoint
CREATE TRIGGER `trg_collections_search_delete` AFTER DELETE ON `collections` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'folders' AND `entity_id` = OLD.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `trg_notes_search_insert` AFTER INSERT ON `notes` WHEN NEW.`deleted_at` IS NULL BEGIN
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  VALUES ('notes', NEW.`id`, NEW.`user_id`, NEW.`title`, NEW.`markdown`);
END;--> statement-breakpoint
CREATE TRIGGER `trg_notes_search_update` AFTER UPDATE ON `notes` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'notes' AND `entity_id` = OLD.`id`;
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'notes', NEW.`id`, NEW.`user_id`, NEW.`title`, NEW.`markdown` WHERE NEW.`deleted_at` IS NULL;
END;--> statement-breakpoint
CREATE TRIGGER `trg_notes_search_delete` AFTER DELETE ON `notes` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'notes' AND `entity_id` = OLD.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `trg_jobs_search_insert` AFTER INSERT ON `jobs` BEGIN
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'jobs', NEW.`id`, '', NEW.`company_name` || ' ' || NEW.`title`, NEW.`category` || ' ' || NEW.`region` || ' ' || NEW.`summary` || ' ' || NEW.`tech_stack`
  WHERE NEW.`status` IN ('ACTIVE', 'DEADLINE_UNKNOWN');
  INSERT OR IGNORE INTO `job_tech_stacks` (`job_id`, `name`, `created_at`)
  SELECT NEW.`id`, trim(CAST(value AS text)), NEW.`updated_at` FROM json_each(NEW.`tech_stack`)
  WHERE json_valid(NEW.`tech_stack`) AND length(trim(CAST(value AS text))) BETWEEN 1 AND 50;
END;--> statement-breakpoint
CREATE TRIGGER `trg_jobs_search_update` AFTER UPDATE ON `jobs` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'jobs' AND `entity_id` = OLD.`id`;
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'jobs', NEW.`id`, '', NEW.`company_name` || ' ' || NEW.`title`, NEW.`category` || ' ' || NEW.`region` || ' ' || NEW.`summary` || ' ' || NEW.`tech_stack`
  WHERE NEW.`status` IN ('ACTIVE', 'DEADLINE_UNKNOWN');
  DELETE FROM `job_tech_stacks` WHERE `job_id` = NEW.`id`;
  INSERT OR IGNORE INTO `job_tech_stacks` (`job_id`, `name`, `created_at`)
  SELECT NEW.`id`, trim(CAST(value AS text)), NEW.`updated_at` FROM json_each(NEW.`tech_stack`)
  WHERE json_valid(NEW.`tech_stack`) AND length(trim(CAST(value AS text))) BETWEEN 1 AND 50;
END;--> statement-breakpoint
CREATE TRIGGER `trg_jobs_search_delete` AFTER DELETE ON `jobs` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'jobs' AND `entity_id` = OLD.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `trg_problems_search_insert` AFTER INSERT ON `coding_problems` WHEN NEW.`active` = 1 BEGIN
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  VALUES ('codingProblems', NEW.`id`, '', NEW.`display_title`, NEW.`tags`);
END;--> statement-breakpoint
CREATE TRIGGER `trg_problems_search_update` AFTER UPDATE ON `coding_problems` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'codingProblems' AND `entity_id` = OLD.`id`;
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'codingProblems', NEW.`id`, '', NEW.`display_title`, NEW.`tags` WHERE NEW.`active` = 1;
END;--> statement-breakpoint
CREATE TRIGGER `trg_problems_search_delete` AFTER DELETE ON `coding_problems` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'codingProblems' AND `entity_id` = OLD.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `trg_solutions_search_insert` AFTER INSERT ON `solutions` WHEN NEW.`deleted_at` IS NULL BEGIN
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  VALUES ('solutions', NEW.`id`, NEW.`author_id`, NEW.`title`, NEW.`description` || ' ' || NEW.`lessons`);
END;--> statement-breakpoint
CREATE TRIGGER `trg_solutions_search_update` AFTER UPDATE ON `solutions` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'solutions' AND `entity_id` = OLD.`id`;
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'solutions', NEW.`id`, NEW.`author_id`, NEW.`title`, NEW.`description` || ' ' || NEW.`lessons` WHERE NEW.`deleted_at` IS NULL;
END;--> statement-breakpoint
CREATE TRIGGER `trg_solutions_search_delete` AFTER DELETE ON `solutions` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'solutions' AND `entity_id` = OLD.`id`;
END;--> statement-breakpoint

CREATE TRIGGER `trg_learning_search_insert` AFTER INSERT ON `learning_units` WHEN NEW.`published` = 1 BEGIN
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'learning', NEW.`id`, '', NEW.`title`, s.`title` || ' ' || NEW.`summary` || ' ' || NEW.`concepts`
  FROM `learning_sources` s WHERE s.`id` = NEW.`source_id`;
END;--> statement-breakpoint
CREATE TRIGGER `trg_learning_search_update` AFTER UPDATE ON `learning_units` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'learning' AND `entity_id` = OLD.`id`;
  INSERT INTO `workspace_search` (`kind`, `entity_id`, `owner_id`, `title`, `body`)
  SELECT 'learning', NEW.`id`, '', NEW.`title`, s.`title` || ' ' || NEW.`summary` || ' ' || NEW.`concepts`
  FROM `learning_sources` s WHERE s.`id` = NEW.`source_id` AND NEW.`published` = 1;
END;--> statement-breakpoint
CREATE TRIGGER `trg_learning_search_delete` AFTER DELETE ON `learning_units` BEGIN
  DELETE FROM `workspace_search` WHERE `kind` = 'learning' AND `entity_id` = OLD.`id`;
END;--> statement-breakpoint

PRAGMA optimize;
