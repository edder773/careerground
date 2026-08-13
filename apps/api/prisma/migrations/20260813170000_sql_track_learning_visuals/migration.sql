ALTER TABLE "LearningUnit" ADD COLUMN "visuals" JSONB;

ALTER TABLE "CodingProblem"
  ADD COLUMN "track" VARCHAR(20) NOT NULL DEFAULT 'ALGORITHM';

CREATE INDEX "CodingProblem_track_level_order_idx"
  ON "CodingProblem"("track", "level", "order");

UPDATE "CodingProblem"
   SET "track" = 'SQL'
 WHERE CAST(substring("sourceUrl" FROM '/lessons/([0-9]+)$') AS INTEGER) IN (
   59034, 59035, 59036, 59037, 59039, 59403, 59404, 59405, 59407,
   131112, 131114, 131528, 131535, 131697, 144853, 164673, 293258, 298515,
   59038, 59040, 59041, 59046, 59047, 59406, 59408, 59409, 59410, 59412,
   59414, 131115, 131120, 131529, 131530, 131533, 131536, 132202, 133026,
   144854, 151137, 164672, 273709, 284530, 293257, 301647, 59042, 59043,
   59044, 59411, 77487, 131113, 131123, 144855, 157341, 164668, 164670,
   164671, 284529, 293261, 59045, 131116, 131117, 131118
 );

DELETE FROM "DailyChallengeParticipation"
 WHERE "challengeId" IN (
   SELECT dc."id"
     FROM "DailyChallenge" dc
     JOIN "CodingProblem" p ON p."id" = dc."problemId"
    WHERE dc."kstDate" = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
      AND dc."levelSlot" IN (1, 2)
      AND p."track" <> 'ALGORITHM'
 );

DELETE FROM "DailyChallenge"
 WHERE "id" IN (
   SELECT dc."id"
     FROM "DailyChallenge" dc
     JOIN "CodingProblem" p ON p."id" = dc."problemId"
    WHERE dc."kstDate" = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
      AND dc."levelSlot" IN (1, 2)
      AND p."track" <> 'ALGORITHM'
 );

UPDATE "LearningUnit"
   SET "visuals" = jsonb_build_array(jsonb_build_object(
     'src', '/learning/' || "anchor" || '.jpg',
     'alt', "title" || ' 관련 원본 PDF 슬라이드 캡처',
     'caption', '제공된 PDF에서 학습 개념을 설명하는 원본 슬라이드를 캡처했습니다.',
     'page', CASE "anchor"
       WHEN 'statistical-thinking' THEN 10
       WHEN 'variables-and-scales' THEN 15
       WHEN 'descriptive-statistics' THEN 35
       WHEN 'sampling-and-probability' THEN 41
       WHEN 'normal-clt-standard-error' THEN 67
       WHEN 'hypothesis-testing' THEN 80
       WHEN 'scatterplot-and-correlation' THEN 6
       WHEN 'correlation-pitfalls' THEN 20
       WHEN 'simple-linear-regression' THEN 27
       WHEN 'regression-evaluation' THEN 40
       WHEN 'regression-assumptions' THEN 52
       WHEN 'llm-capabilities-and-limits' THEN 25
       WHEN 'prompt-control-basics' THEN 33
       WHEN 'rice-framework' THEN 49
       WHEN 'prompting-techniques' THEN 58
       WHEN 'format-and-meta-prompting' THEN 73
       WHEN 'context-and-harness-engineering' THEN 91
       WHEN 'product-and-operations-vocabulary' THEN 5
       WHEN 'web-system-basics' THEN 15
       WHEN 'development-environment' THEN 24
       WHEN 'git-mental-model' THEN 30
       WHEN 'git-collaboration-and-security' THEN 48
       WHEN 'ai-coding-validation-loop' THEN 59
     END
   ))
 WHERE "anchor" IN (
   'statistical-thinking', 'variables-and-scales', 'descriptive-statistics',
   'sampling-and-probability', 'normal-clt-standard-error', 'hypothesis-testing',
   'scatterplot-and-correlation', 'correlation-pitfalls', 'simple-linear-regression',
   'regression-evaluation', 'regression-assumptions', 'llm-capabilities-and-limits',
   'prompt-control-basics', 'rice-framework', 'prompting-techniques',
   'format-and-meta-prompting', 'context-and-harness-engineering',
   'product-and-operations-vocabulary', 'web-system-basics', 'development-environment',
   'git-mental-model', 'git-collaboration-and-security', 'ai-coding-validation-loop'
 );
