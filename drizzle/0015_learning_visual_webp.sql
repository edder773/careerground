UPDATE `learning_units`
SET `visuals` = replace(`visuals`, '.jpg', '.webp'), `updated_at` = '2026-08-14T03:00:00.000Z'
WHERE `visuals` LIKE '%.jpg%';--> statement-breakpoint
PRAGMA optimize;
