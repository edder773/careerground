import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString =
  process.env.DATABASE_URL ||
  (process.env.NODE_ENV === 'production'
    ? undefined
    : 'postgresql://careerground:careerground@127.0.0.1:5432/careerground?schema=public');
if (!connectionString) throw new Error('production seed requires DATABASE_URL');
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const sha = (value: string) => createHash('sha256').update(value).digest('hex');

const kstDate = (date = new Date()) => {
  const value = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
  return new Date(`${value}T00:00:00.000Z`);
};

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@careerground.local' },
    create: {
      email: process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@careerground.local',
      displayName: '데모 관리자',
      role: 'ADMIN',
      preferredLanguage: 'javascript',
      onboardingCompletedAt: new Date(),
      rankingOptIn: false,
      preference: { create: {} },
    },
    update: {
      displayName: '데모 관리자',
      role: 'ADMIN',
      isActive: true,
      preferredLanguage: 'javascript',
      onboardingCompletedAt: new Date(),
    },
  });
  const member = await prisma.user.upsert({
    where: { email: 'member@careerground.local' },
    create: {
      email: 'member@careerground.local',
      displayName: '김그라운드',
      preferredLanguage: 'javascript',
      onboardingCompletedAt: new Date(),
      preference: { create: {} },
    },
    update: {
      displayName: '김그라운드',
      isActive: true,
      preferredLanguage: 'javascript',
      onboardingCompletedAt: new Date(),
    },
  });
  const member2 = await prisma.user.upsert({
    where: { email: 'peer@careerground.local' },
    create: {
      email: 'peer@careerground.local',
      displayName: '이플레이어',
      preferredLanguage: 'python',
      onboardingCompletedAt: new Date(),
      preference: { create: {} },
    },
    update: {
      displayName: '이플레이어',
      isActive: true,
      preferredLanguage: 'python',
      onboardingCompletedAt: new Date(),
    },
  });
  const visualMember = await prisma.user.upsert({
    where: { email: 'visual@careerground.local' },
    create: {
      email: 'visual@careerground.local',
      displayName: '박비주얼',
      preferredLanguage: 'javascript',
      onboardingCompletedAt: new Date(),
      rankingOptIn: false,
      preference: { create: {} },
    },
    update: {
      displayName: '박비주얼',
      isActive: true,
      rankingOptIn: false,
      preferredLanguage: 'javascript',
      onboardingCompletedAt: new Date(),
    },
  });

  const source = await prisma.jobSource.upsert({
    where: { name: 'CareerGround Demo Source' },
    create: {
      name: 'CareerGround Demo Source',
      homeUrl: 'https://example.com/demo-jobs',
      lastSuccessAt: new Date(),
    },
    update: { lastSuccessAt: new Date(), lastError: null },
  });
  const companyDefs = [
    ['데모 대기업', 'LARGE'],
    ['샘플 엔터프라이즈', 'LARGE'],
    ['데모 공공기관', 'PUBLIC'],
    ['샘플 공기업', 'PUBLIC'],
    ['데모 중견사', 'MID'],
    ['샘플 테크', 'MID'],
    ['데모 소프트', 'SMALL'],
    ['샘플 랩스', 'SMALL'],
  ] as const;
  const companies = [];
  for (const [name, size] of companyDefs) {
    companies.push(
      await prisma.company.upsert({
        where: { normalizedName: name.replace(/\s/g, '').toLowerCase() },
        create: {
          name,
          normalizedName: name.replace(/\s/g, '').toLowerCase(),
          size,
          sizeEvidence: 'deterministic development seed',
        },
        update: { size, sizeEvidence: 'deterministic development seed' },
      }),
    );
  }
  const categories = [
    '백엔드',
    '프론트엔드',
    '데이터 엔지니어링',
    'AI/ML',
    'DevOps/SRE',
    '정보보안',
    'QA/테스트',
    '공기업 전산 일반',
  ];
  const jobs = [];
  for (const [index, company] of companies.entries()) {
    const canonicalUrl = `https://example.com/demo-jobs/${index + 1}`;
    jobs.push(
      await prisma.jobPosting.upsert({
        where: { canonicalUrl },
        create: {
          sourceId: source.id,
          companyId: company.id,
          sourcePostingId: `demo-${index + 1}`,
          sourceUrl: canonicalUrl,
          canonicalUrl,
          title: `[DEMO] ${categories[index]} 신입`,
          category: categories[index],
          careerScope: index % 2 ? 'NEW_GRAD_ELIGIBLE' : 'NEW_GRAD_ONLY',
          careerEvidence: '개발 seed의 신입 대상 표시',
          companySizeEvidence: '개발 seed',
          employmentType: 'FULL_TIME',
          region: index % 2 ? '경기' : '서울',
          remote: index % 3 === 0,
          techStack: index % 2 ? ['Python', 'PostgreSQL'] : ['TypeScript', 'React'],
          publishedAt: new Date(Date.now() - index * 86_400_000),
          deadlineAt: new Date(Date.now() + (index + 1) * 3 * 86_400_000),
          rolling: false,
          collectedAt: new Date(),
          lastVerifiedAt: new Date(),
          fingerprint: sha(`${company.name}|${categories[index]}|demo`),
          summary: '화면과 필터를 검증하기 위한 명시적 개발용 공고입니다.',
          status: 'ACTIVE',
        },
        update: { status: 'ACTIVE', lastVerifiedAt: new Date() },
      }),
    );
  }

  const problemDefs = [
    ['[DEMO] 배열 순회 연습', 1, '12901'],
    ['[DEMO] 문자열 처리 연습', 1, '12916'],
    ['[DEMO] 해시 탐색 연습', 2, '42576'],
    ['[DEMO] 스택 연습', 2, '12909'],
    ['[DEMO] 그래프 연습', 3, '43162'],
    ['[DEMO] 동적 계획 연습', 3, '42898'],
  ] as const;
  const problems = [];
  for (const [order, [displayTitle, level, id]] of problemDefs.entries()) {
    const sourceUrl = `https://school.programmers.co.kr/learn/courses/30/lessons/${id}`;
    problems.push(
      await prisma.codingProblem.upsert({
        where: { sourceUrl },
        create: {
          sourceUrl,
          displayTitle,
          level,
          tags: level === 1 ? ['구현'] : level === 2 ? ['자료구조'] : ['그래프'],
          order,
        },
        update: { displayTitle, level, active: true, order },
      }),
    );
  }
  const solution =
    (await prisma.solution.findFirst({
      where: { authorId: member.id, problemId: problems[0]!.id },
    })) ||
    (await prisma.solution.create({
      data: {
        authorId: member.id,
        problemId: problems[0]!.id,
        title: '한 번 순회하는 데모 풀이',
        language: 'javascript',
        code: 'export function demo(values: number[]) {\n  return values.reduce((sum, value) => sum + value, 0);\n}',
        description:
          '배열을 한 번 순회합니다. 외부 문제 원문이나 테스트케이스는 저장하지 않습니다.',
        timeComplexity: 'O(n)',
        spaceComplexity: 'O(1)',
        lessons: '입력 전체를 한 번만 확인했습니다.',
        solved: true,
        solvedAt: new Date(),
        visibility: 'MEMBERS',
        revisions: {
          create: {
            revision: 1,
            code: 'export function demo(values: number[]) {\n  return values.reduce((sum, value) => sum + value, 0);\n}',
            description: '배열을 한 번 순회합니다.',
          },
        },
      },
    }));
  await prisma.problemProgress.upsert({
    where: { userId_problemId: { userId: member.id, problemId: problems[0]!.id } },
    create: {
      userId: member.id,
      problemId: problems[0]!.id,
      status: 'SOLVED',
      solvedAt: new Date(),
      favorite: true,
    },
    update: { status: 'SOLVED', solvedAt: new Date(), favorite: true },
  });
  const existingComment = await prisma.solutionComment.findFirst({
    where: { solutionId: solution.id, authorId: member2.id },
  });
  if (!existingComment)
    await prisma.solutionComment.create({
      data: {
        solutionId: solution.id,
        authorId: member2.id,
        markdown: '순회 횟수가 명확해서 이해하기 좋았습니다.',
      },
    });

  const challenge = await prisma.dailyChallenge.upsert({
    where: { kstDate: kstDate() },
    create: {
      kstDate: kstDate(),
      problemId: problems[1]!.id,
      candidateCount: problems.length,
      allowedLevels: [1, 2],
      repeatWindowDays: 60,
      selectionSeed: sha(kstDate().toISOString()).slice(0, 16),
      selectionReason: 'deterministic development seed',
    },
    update: {},
  });
  await prisma.dailyChallengeSetting.upsert({
    where: { id: 1 },
    create: { id: 1, allowedLevels: [1, 2], repeatExclusionDays: 60 },
    update: {},
  });
  await prisma.dailyChallengeParticipation.upsert({
    where: { challengeId_userId: { challengeId: challenge.id, userId: member.id } },
    create: { challengeId: challenge.id, userId: member.id, completedAt: new Date() },
    update: { completedAt: new Date() },
  });

  const learningChecksum = sha('careerground-deterministic-learning-seed-v1');
  let learningVersion = await prisma.learningSourceVersion.findUnique({
    where: { sha256: learningChecksum },
    include: { source: true },
  });
  if (!learningVersion) {
    const learningSource = await prisma.learningSource.create({
      data: {
        title: '[DEMO] 웹 접근성 기초',
        subject: '프론트엔드',
        category: '접근성',
        status: 'READY',
        publishedById: admin.id,
      },
    });
    learningVersion = await prisma.learningSourceVersion.create({
      data: {
        sourceId: learningSource.id,
        version: '1.0',
        sha256: learningChecksum,
        extractionMeta: { demo: true },
      },
      include: { source: true },
    });
    await prisma.learningUnit.create({
      data: {
        sourceId: learningSource.id,
        anchor: 'keyboard-focus',
        title: '키보드와 포커스',
        summary: '모든 핵심 동작은 키보드로 실행 가능해야 하며 포커스가 보여야 합니다.',
        concepts: ['키보드 탐색', 'focus-visible'],
        published: true,
        revisions: {
          create: { revision: 1, markdown: '모든 핵심 동작은 키보드로 실행 가능해야 합니다.' },
        },
        flashcards: {
          create: [
            {
              front: '포커스 표시의 목적은?',
              back: '현재 키보드 탐색 위치를 알리기 위해서입니다.',
            },
          ],
        },
        questions: {
          create: [
            {
              type: 'SHORT_ANSWER',
              prompt: '키보드 사용자가 현재 위치를 아는 방법은?',
              answer: '명확한 포커스 표시',
              choices: [],
            },
          ],
        },
      },
    });
  }
  const unit = await prisma.learningUnit.findFirstOrThrow({
    where: { sourceId: learningVersion.sourceId },
  });
  await prisma.learningProgress.upsert({
    where: { userId_unitId: { userId: member.id, unitId: unit.id } },
    create: {
      userId: member.id,
      unitId: unit.id,
      completed: true,
      understanding: 4,
      lastStudiedAt: new Date(),
      nextReviewAt: new Date(Date.now() - 60_000),
      repetitionCount: 1,
      intervalDays: 1,
    },
    update: { nextReviewAt: new Date(Date.now() - 60_000) },
  });

  let collection = await prisma.collection.findFirst({
    where: { userId: member.id, name: '취업 준비', deletedAt: null },
  });
  if (!collection)
    collection = await prisma.collection.create({
      data: { userId: member.id, name: '취업 준비', icon: 'briefcase', color: 'cyan', position: 0 },
    });

  const visualCollection = await prisma.collection.findFirst({
    where: { userId: visualMember.id, name: '나의 성장 기록', deletedAt: null },
  });
  if (!visualCollection)
    await prisma.collection.create({
      data: {
        userId: visualMember.id,
        name: '나의 성장 기록',
        icon: 'folder',
        color: 'cyan',
        position: 0,
      },
    });
  await prisma.collectionItem.upsert({
    where: {
      collectionId_itemType_targetId: {
        collectionId: collection.id,
        itemType: 'JOB_POSTING',
        targetId: jobs[0]!.id,
      },
    },
    create: {
      collectionId: collection.id,
      itemType: 'JOB_POSTING',
      targetId: jobs[0]!.id,
      label: jobs[0]!.title,
    },
    update: {},
  });
  await prisma.collectionItem.upsert({
    where: {
      collectionId_itemType_targetId: {
        collectionId: collection.id,
        itemType: 'CODING_PROBLEM',
        targetId: problems[0]!.id,
      },
    },
    create: {
      collectionId: collection.id,
      itemType: 'CODING_PROBLEM',
      targetId: problems[0]!.id,
      label: problems[0]!.displayTitle,
      position: 1,
    },
    update: {},
  });
  await prisma.savedJob.upsert({
    where: { userId_jobId: { userId: member.id, jobId: jobs[0]!.id } },
    create: { userId: member.id, jobId: jobs[0]!.id, status: 'PLANNED', memo: '개발 seed 메모' },
    update: {},
  });
  await prisma.notification.createMany({
    data: [
      {
        userId: member.id,
        type: 'DAILY_CHALLENGE',
        title: '오늘의 코딩테스트',
        message: problems[1]!.displayTitle,
        href: '/coding',
      },
      {
        userId: member.id,
        type: 'REVIEW_DUE',
        title: '복습할 학습 단위',
        message: unit.title,
        href: '/learning',
      },
    ],
    skipDuplicates: true,
  });

  console.log('Seed complete');
  console.log(`Admin: ${admin.email}`);
  console.log('Member: member@careerground.local');
  console.log('Peer: peer@careerground.local');
  console.log('Visual QA: visual@careerground.local');
  console.log('Interactive sign-in: OpenAI Sites identity only');
}

await main().finally(() => prisma.$disconnect());
