import { BriefcaseBusiness, Code2, Sparkles, Star, Trash2 } from 'lucide-react';
import { Link } from 'react-router';
import { useLocalFavorites, type LocalFavorite } from '../lib/local-favorites';
import '../styles/home.css';

const itemTypeLabels: Record<LocalFavorite['itemType'], string> = {
  JOB_POSTING: '채용공고',
  CODING_PROBLEM: '코딩 문제',
};

export function FavoritesPage() {
  const favorites = useLocalFavorites();

  return (
    <div className="home-page finder-home favorites-home">
      <section className="page-heading finder-canvas-heading">
        <div>
          <span className="eyebrow">
            <Sparkles size={15} /> 나의 관심 항목
          </span>
          <h1>즐겨찾기</h1>
          <p>이 브라우저에 저장한 채용공고와 코딩 문제를 한곳에서 다시 확인하세요.</p>
        </div>
      </section>

      <section className="favorite-shortcuts" aria-label="즐겨찾기 바로가기">
        <Link to="/?saved=1&view=list">
          <BriefcaseBusiness aria-hidden="true" />
          <span>
            <strong>관심 공고</strong>
            <small>저장한 채용공고만 목록으로 보기</small>
          </span>
        </Link>
        <Link to="/coding?favorites=1&view=all">
          <Code2 aria-hidden="true" />
          <span>
            <strong>즐겨찾기 문제</strong>
            <small>별표한 코딩 문제만 보기</small>
          </span>
        </Link>
      </section>

      <section className="section-block favorite-library">
        <div className="section-title">
          <div>
            <h2>저장한 항목</h2>
            <span>{favorites.items.length}개</span>
          </div>
          <p>즐겨찾기는 계정 없이 현재 기기에만 안전하게 저장됩니다.</p>
        </div>
        {favorites.items.length === 0 && (
          <div className="empty-panel">
            <Star />
            <h3>아직 저장한 항목이 없습니다</h3>
            <p>채용공고나 코딩 문제의 별표를 눌러 이곳에 모아보세요.</p>
          </div>
        )}
        <div className="favorite-item-grid">
          {favorites.items.map((item) => (
            <article key={`${item.itemType}:${item.targetId}`}>
              <span className="favorite-item-icon">
                <Star fill="currentColor" aria-hidden="true" />
              </span>
              <span className="favorite-item-copy">
                <small>{itemTypeLabels[item.itemType]}</small>
                <strong>{item.label}</strong>
              </span>
              <span className="favorite-item-actions">
                <Link to={item.href}>열기</Link>
                <button
                  type="button"
                  aria-label={`${item.label} 즐겨찾기 해제`}
                  onClick={() => favorites.remove(item.itemType, item.targetId)}
                >
                  <Trash2 aria-hidden="true" /> 해제
                </button>
              </span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
