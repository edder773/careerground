import { useQuery } from '@tanstack/react-query';
import { Award, CalendarDays, Flame, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import '../styles/notifications.css';

type Ranking = {
  calculatedAt: string;
  currentUserId: string;
  selfReported: boolean;
  periods: { timezone: string; weeklyStart: string; monthlyStart: string };
  methodology: string;
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
            {ranking.data?.methodology ||
              '모든 멤버의 SOLVED 풀이를 사용자·문제별 한 번만 자동 계산하며 관리자는 제외됩니다.'}
          </span>
        </div>
      </div>
      {ranking.isLoading && <div className="loading-panel">랭킹 계산 중…</div>}
      {ranking.isError && <div className="error-panel">랭킹을 불러오지 못했습니다.</div>}
      {ranking.data?.rows.length === 0 ? (
        <div className="empty-panel">
          <Trophy />
          <h3>아직 집계할 풀이가 없습니다</h3>
          <p>첫 풀이를 저장하면 랭킹에 자동 반영됩니다.</p>
        </div>
      ) : (
        <div className="ranking-table-scroll">
          <table className="ranking-table">
            <caption className="sr-only">코딩 랭킹</caption>
            <thead>
              <tr>
                <th scope="col">순위</th>
                <th scope="col">멤버</th>
                <th scope="col">누적</th>
                <th scope="col">주간</th>
                <th scope="col">월간</th>
                <th scope="col">연속</th>
                <th scope="col">오늘의 문제</th>
              </tr>
            </thead>
            <tbody>
              {ranking.data?.rows.map((row) => (
                <tr
                  className={`rank-${row.rank} ${row.userId === ranking.data.currentUserId ? 'current-user' : ''}`}
                  aria-current={row.userId === ranking.data.currentUserId ? 'true' : undefined}
                  key={row.userId}
                >
                  <td>{row.rank <= 3 ? <span className="medal">{row.rank}</span> : row.rank}</td>
                  <th scope="row">{row.displayName}</th>
                  <td>{row.score}</td>
                  <td>{row.weekly}</td>
                  <td>{row.monthly}</td>
                  <td>
                    <Flame />
                    {row.streak}일
                  </td>
                  <td>
                    <CalendarDays />
                    {row.challengeCount}회
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {ranking.data && (
        <small className="calculated-at">
          기준: Asia/Seoul · 주간{' '}
          {new Date(ranking.data.periods.weeklyStart).toLocaleDateString('ko-KR')}부터 · 월간{' '}
          {new Date(ranking.data.periods.monthlyStart).toLocaleDateString('ko-KR')}부터 · 집계 시각{' '}
          {new Date(ranking.data.calculatedAt).toLocaleString('ko-KR')}
        </small>
      )}
    </div>
  );
}
