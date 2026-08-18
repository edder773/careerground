-- This migration intentionally destroys all personal note data without a backup.
DELETE FROM "CollectionItem" WHERE "itemType" = 'NOTE';

DROP TABLE "NoteRevision";
DROP TABLE "Note";

ALTER TYPE "CollectionItemType" RENAME TO "CollectionItemType_legacy";
CREATE TYPE "CollectionItemType" AS ENUM (
  'LEARNING_SOURCE',
  'LEARNING_UNIT',
  'JOB_POSTING',
  'CODING_PROBLEM',
  'SOLUTION',
  'EXTERNAL_LINK'
);
ALTER TABLE "CollectionItem"
  ALTER COLUMN "itemType" TYPE "CollectionItemType"
  USING ("itemType"::text::"CollectionItemType");
DROP TYPE "CollectionItemType_legacy";
