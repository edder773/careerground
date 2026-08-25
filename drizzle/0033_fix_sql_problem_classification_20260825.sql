UPDATE `coding_problems`
   SET `track` = 'SQL',
       `updated_at` = '2026-08-25T00:45:00.000Z'
 WHERE `id` IN (
   'problem-programmers-132201',
   'problem-programmers-133024',
   'problem-programmers-133025',
   'problem-programmers-151136'
 );--> statement-breakpoint
DELETE FROM `daily_challenge_participations`
 WHERE `challenge_id` IN (
   SELECT dc.`id`
     FROM `daily_challenges` dc
     JOIN `coding_problems` p ON p.`id` = dc.`problem_id`
    WHERE dc.`kst_date` = date('now', '+9 hours')
      AND (
        (dc.`level_slot` IN (1, 2, 3) AND p.`track` <> 'ALGORITHM')
        OR (dc.`level_slot` = 34 AND (p.`track` <> 'SQL' OR p.`level` NOT IN (3, 4)))
      )
 );--> statement-breakpoint
DELETE FROM `daily_challenges`
 WHERE `id` IN (
   SELECT dc.`id`
     FROM `daily_challenges` dc
     JOIN `coding_problems` p ON p.`id` = dc.`problem_id`
    WHERE dc.`kst_date` = date('now', '+9 hours')
      AND (
        (dc.`level_slot` IN (1, 2, 3) AND p.`track` <> 'ALGORITHM')
        OR (dc.`level_slot` = 34 AND (p.`track` <> 'SQL' OR p.`level` NOT IN (3, 4)))
      )
 );--> statement-breakpoint
PRAGMA optimize;
