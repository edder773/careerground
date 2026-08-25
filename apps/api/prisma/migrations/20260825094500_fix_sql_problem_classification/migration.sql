UPDATE "CodingProblem"
   SET "track" = 'SQL',
       "updatedAt" = CURRENT_TIMESTAMP
 WHERE "sourceUrl" IN (
   'https://school.programmers.co.kr/learn/courses/30/lessons/132201',
   'https://school.programmers.co.kr/learn/courses/30/lessons/133024',
   'https://school.programmers.co.kr/learn/courses/30/lessons/133025',
   'https://school.programmers.co.kr/learn/courses/30/lessons/151136'
 );

DELETE FROM "DailyChallenge"
 WHERE "kstDate" = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Seoul')::date
   AND "id" IN (
     SELECT dc."id"
       FROM "DailyChallenge" dc
       JOIN "CodingProblem" p ON p."id" = dc."problemId"
      WHERE (
        (dc."levelSlot" IN (1, 2, 3) AND p."track" <> 'ALGORITHM')
        OR (dc."levelSlot" = 34 AND (p."track" <> 'SQL' OR p."level" NOT IN (3, 4)))
      )
   );
