import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing, CheckCheck, MessageCircle, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router';
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
const iconFor = (type: string) =>
  type === 'COMMENT' || type === 'REPLY'
    ? MessageCircle
    : type === 'REVIEW_DUE'
      ? RefreshCcw
      : BellRing;

export function NotificationsPage() {
  const client = useQueryClient();
  const navigate = useNavigate();
  const [type, setType] = useState('');
  const notifications = useQuery({
    queryKey: ['notifications', type],
    queryFn: () =>
      api<Notification[]>(`/notifications${type ? `?type=${encodeURIComponent(type)}` : ''}`),
  });
  const readAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['notifications'] });
      void client.invalidateQueries({ queryKey: ['notification-unread-count'] });
    },
  });
  const read = useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: 'PATCH' }),
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: ['notifications'] });
      const previous = client.getQueriesData<Notification[]>({ queryKey: ['notifications'] });
      client.setQueriesData<Notification[]>({ queryKey: ['notifications'] }, (current) =>
        current?.map((item) =>
          item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item,
        ),
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
      <div className="notification-filter">
        <label>
          알림 유형
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="">전체</option>
            <option value="COMMENT">댓글</option>
            <option value="REPLY">답글</option>
            <option value="JOB_DEADLINE">채용 마감</option>
            <option value="LEARNING_REVIEW">학습 복습</option>
            <option value="SYSTEM">시스템</option>
          </select>
        </label>
      </div>
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
              onClick={async () => {
                await read.mutateAsync(item.id);
                if (item.href?.startsWith('/')) navigate(item.href);
              }}
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
