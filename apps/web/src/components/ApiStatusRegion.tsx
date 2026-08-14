import { useEffect, useState } from 'react';

export const apiStatusEvent = 'careerground:api-status';

export function ApiStatusRegion() {
  const [message, setMessage] = useState('');
  useEffect(() => {
    let timer: number | undefined;
    const listener = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message || '요청을 처리하지 못했습니다.');
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setMessage(''), 5_000);
    };
    window.addEventListener(apiStatusEvent, listener);
    return () => {
      window.removeEventListener(apiStatusEvent, listener);
      if (timer) window.clearTimeout(timer);
    };
  }, []);
  return (
    <div
      className={`api-status-toast ${message ? 'visible' : ''}`}
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
