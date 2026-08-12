import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, CheckCheck, MessageCircle, RefreshCcw } from 'lucide-react';
import { api } from '../lib/api';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  href?: string;
  readAt?: string;
  createdAt: string;
};
const iconFor = (type: string) =>
  type === 'COMMENT' || type === 'REPLY'
    ? MessageCircle
    : type === 'REVIEW_DUE'
      ? RefreshCcw
      : BellRing;

export function NotificationsPage() {
  const client = useQueryClient();
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api<Notification[]>('/notifications'),
  });
  const readAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const read = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['notifications'] }),
  });
  return (
    <div>
      <section className="page-heading">
        <div>
          <span className="eyebrow">
            <Bell size={15} /> 인앱 알림
          </span>
          <h1>알림</h1>
          <p>댓글, 공고 마감, 오늘의 문제, 복습 일정을 모아봅니다.</p>
        </div>
        <button className="ghost-button" onClick={() => readAll.mutate()}>
          <CheckCheck /> 모두 읽음
        </button>
      </section>
      {notifications.isLoading && <div className="loading-panel">알림을 불러오는 중…</div>}
      {!notifications.isLoading && !notifications.data?.length && (
        <div className="empty-panel">
          <Bell />
          <h3>새 알림이 없습니다</h3>
          <p>중요한 업데이트가 생기면 여기에 표시됩니다.</p>
        </div>
      )}
      <div className="notification-list">
        {notifications.data?.map((item) => {
          const Icon = iconFor(item.type);
          return (
            <button
              key={item.id}
              className={item.readAt ? 'read' : 'unread'}
              onClick={() => read.mutate(item.id)}
            >
              <span className="notification-icon">
                <Icon />
              </span>
              <span>
                <strong>{item.title}</strong>
                <p>{item.message}</p>
                <small>{new Date(item.createdAt).toLocaleString('ko-KR')}</small>
              </span>
              {!item.readAt && <i aria-label="읽지 않음" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
