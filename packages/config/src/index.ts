export const brand = {
  name: 'CareerGround',
  shortName: 'CareerGround',
  description: '작은 팀을 위한 학습·취업·코딩 성장 워크스페이스',
} as const;

export const productLinks = {
  certificationLearning: 'https://baeumzip.site',
} as const;

export function resolveBrandName(value?: string) {
  return value?.trim() || brand.name;
}

export const limits = {
  collectionName: 80,
  note: 50_000,
  solutionCode: 100_000,
  solutionDescription: 30_000,
  comment: 4_000,
} as const;

export const timeZone = 'Asia/Seoul';
