import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  ChevronRight,
  MessageCircle,
  RefreshCcw,
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router';
import { api } from '../lib/api';
import '../styles/notifications.css';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};
type NotificationPage = { items: Notification[]; nextCursor: string | null };

const iconFor = (type: string) =>
  type === 'COMMENT' || type === 'REPLY'
    ? MessageCircle
    : type === 'LEARNING_REVIEW'
      ? RefreshCcw
      : BellRing;

const typeLabels: Record<string, string> = {
  COMMENT: '댓글',
  REPLY: '답글',
  JOB_DEADLINE: '채용 마감',
  LEARNING_REVIEW: '학습 복습',
  SYSTEM: '시스템',
};

export function NotificationsPage() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const type = searchParams.get('type') || '';
  const unreadOnly = searchParams.get('unread') === '1';
  const setFilter = (key: 'type' | 'unread', value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next, { replace: true });
  };
  const notifications = useInfiniteQuery({
    queryKey: ['notifications', type, unreadOnly],
    initialPageParam: '',
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ page: 'cursor', limit: '30' });
      if (type) params.set('type', type);
      if (unreadOnly) params.set('unread', '1');
      if (pageParam) params.set('cursor', pageParam);
      return api<NotificationPage>(`/notifications?${params}`);
    },
    getNextPageParam: (page) => page.nextCursor || undefined,
  });
  const rows = notifications.data?.pages.flatMap((page) => page.items) || [];
  const readAll = useMutation({
    mutationFn: () => api<{ count: number }>('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['notifications'] });
      void client.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });
  const read = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ['notifications'] });
      const previous = client.getQueriesData<InfiniteData<NotificationPage>>({
        queryKey: ['notifications'],
      });
      client.setQueriesData<InfiniteData<NotificationPage>>(
        { queryKey: ['notifications'] },
        (current) =>
          current
            ? {
                ...current,
                pages: current.pages.map((page) => ({
                  ...page,
                  items: page.items.map((item) =>
                    item.id === id
                      ? { ...item, readAt: item.readAt || new Date().toISOString() }
                      : item,
                  ),
                })),
              }
            : current,
      );
      return { previous };
    },
    onError: (_error, _id, context) =>
      context?.previous.forEach(([key, value]) => client.setQueryData(key, value)),
    onSettled: () => {
      void client.invalidateQueries({ queryKey: ['notifications'] });
      void client.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });
  return (
    <div className="notifications-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Bell size={15} /> 인앱 알림
          </span>
          <h1>알림</h1>
          <p>댓글, 공고 마감, 오늘의 문제 알림을 모아봅니다.</p>
        </div>
        <button
          className="ghost-button"
          disabled={readAll.isPending}
          onClick={() => readAll.mutate()}
        >
          <CheckCheck /> {readAll.isPending ? '처리 중…' : '모두 읽음'}
        </button>
      </section>
      <div className="notification-filter">
        <label>
          알림 유형
          <select value={type} onChange={(event) => setFilter('type', event.target.value)}>
            <option value="">전체</option>
            <option value="COMMENT">댓글</option>
            <option value="REPLY">답글</option>
            <option value="JOB_DEADLINE">채용 마감</option>
            <option value="LEARNING_REVIEW">학습 복습</option>
            <option value="SYSTEM">시스템</option>
          </select>
        </label>
        <label className="notification-unread-filter">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(event) => setFilter('unread', event.target.checked ? '1' : '')}
          />
          읽지 않은 알림만
        </label>
      </div>
      {notifications.isLoading && <div className="loading-panel">알림을 불러오는 중…</div>}
      {notifications.isError && (
        <div className="error-panel" role="alert">
          알림을 불러오지 못했습니다.
          <button type="button" onClick={() => void notifications.refetch()}>
            다시 시도
          </button>
        </div>
      )}
      {!notifications.isLoading && !notifications.isError && rows.length === 0 && (
        <div className="empty-panel">
          <Bell />
          <h3>{unreadOnly ? '읽지 않은 알림이 없습니다' : '새 알림이 없습니다'}</h3>
          <p>중요한 업데이트가 생기면 여기에 표시됩니다.</p>
        </div>
      )}
      <div className="notification-list">
        {rows.map((item) => {
          const Icon = iconFor(item.type);
          const internalHref = item.href?.startsWith('/') ? item.href : undefined;
          return (
            <article key={item.id} className={item.readAt ? 'read' : 'unread'}>
              <span className="notification-icon">
                <Icon />
              </span>
              <span className="notification-copy">
                <small className="notification-type">{typeLabels[item.type] || '알림'}</small>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.createdAt).toLocaleString('ko-KR')}</small>
              </span>
              <span className="notification-actions">
                {!item.readAt && (
                  <button
                    type="button"
                    disabled={read.isPending}
                    onClick={() => read.mutate(item.id)}
                  >
                    <Check aria-hidden="true" /> 읽음 처리
                  </button>
                )}
                {internalHref && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.readAt) read.mutate(item.id);
                      navigate(internalHref);
                    }}
                  >
                    관련 내용 보기 <ChevronRight aria-hidden="true" />
                  </button>
                )}
                {item.readAt && !internalHref && <small>읽음</small>}
              </span>
            </article>
          );
        })}
      </div>
      {notifications.hasNextPage && (
        <button
          type="button"
          className="ghost-button notification-load-more"
          disabled={notifications.isFetchingNextPage}
          onClick={() => void notifications.fetchNextPage()}
        >
          {notifications.isFetchingNextPage ? '불러오는 중…' : '이전 알림 더 보기'}
        </button>
      )}
    </div>
  );
}
