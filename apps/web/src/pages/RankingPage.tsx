import { useQuery } from '@tanstack/react-query';
import { Award, CalendarDays, Flame, Trophy } from 'lucide-react';
import { api } from '../lib/api';

type Ranking = {
  calculatedAt: string;
  selfReported: boolean;
  rows: Array<{
    userId: string;
    displayName: string;
    rank: number;
    score: number;
    weekly: number;
    monthly: number;
    streak: number;
    challengeCount: number;
  }>;
};

export function RankingPage() {
  const ranking = useQuery({
    queryKey: ['rankings'],
    queryFn: () => api<Ranking>('/coding/rankings'),
  });
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Trophy size={15} /> 팀의 꾸준함
          </span>
          <h1>랭킹</h1>
          <p>멤버가 해결한 문제 수와 꾸준한 학습 기록을 함께 확인합니다.</p>
        </div>
      </section>
      <div className="ranking-notice">
        <Award />
        <div>
          <strong>동점은 같은 순위로 표시합니다.</strong>
          <span>
            모든 멤버의 SOLVED 풀이를 사용자·문제별 한 번만 자동 계산하며 관리자는 제외됩니다.
          </span>
        </div>
      </div>
      {ranking.isLoading && <div className="loading-panel">랭킹 계산 중…</div>}
      {ranking.isError && <div className="error-panel">랭킹을 불러오지 못했습니다.</div>}
      <div className="ranking-table" role="table" aria-label="코딩 랭킹">
        <div className="ranking-row header" role="row">
          <span>순위</span>
          <span>멤버</span>
          <span>누적</span>
          <span>주간</span>
          <span>월간</span>
          <span>연속</span>
          <span>오늘의 문제</span>
        </div>
        {ranking.data?.rows.map((row) => (
          <div className={`ranking-row rank-${row.rank}`} role="row" key={row.userId}>
            <span>{row.rank <= 3 ? <span className="medal">{row.rank}</span> : row.rank}</span>
            <strong>{row.displayName}</strong>
            <span>{row.score}</span>
            <span>{row.weekly}</span>
            <span>{row.monthly}</span>
            <span>
              <Flame />
              {row.streak}일
            </span>
            <span>
              <CalendarDays />
              {row.challengeCount}회
            </span>
          </div>
        ))}
      </div>
      {ranking.data && (
        <small className="calculated-at">
          집계 시각 {new Date(ranking.data.calculatedAt).toLocaleString('ko-KR')}
        </small>
      )}
    </div>
  );
}
