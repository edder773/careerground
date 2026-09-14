export const verifiedCatalogDate: string;
export function verifiedCodingMetadata(sourceUrl: string): {
  lessonId: number;
  track: 'ALGORITHM' | 'SQL';
  level: number;
} | null;
export function isVerifiedCodingProblem(problem: {
  sourceUrl: string;
  track: string;
  level: number;
}): boolean;
