const SEOUL_TIME_ZONE = 'Asia/Seoul';

// Source: Korea Astronomy and Space Science Institute, 2026 calendar requirements.
// https://www.kasi.re.kr/kor/post/newsMaterial/32031
const KOREAN_PUBLIC_HOLIDAYS = {
  2026: new Map([
    ['2026-01-01', '신정'],
    ['2026-02-16', '설날 연휴'],
    ['2026-02-17', '설날'],
    ['2026-02-18', '설날 연휴'],
    ['2026-03-01', '삼일절'],
    ['2026-03-02', '삼일절 대체공휴일'],
    ['2026-05-05', '어린이날'],
    ['2026-05-24', '부처님오신날'],
    ['2026-05-25', '부처님오신날 대체공휴일'],
    ['2026-06-03', '전국동시지방선거'],
    ['2026-06-06', '현충일'],
    ['2026-08-15', '광복절'],
    ['2026-08-17', '광복절 대체공휴일'],
    ['2026-09-24', '추석 연휴'],
    ['2026-09-25', '추석'],
    ['2026-09-26', '추석 연휴'],
    ['2026-10-03', '개천절'],
    ['2026-10-05', '개천절 대체공휴일'],
    ['2026-10-09', '한글날'],
    ['2026-12-25', '기독탄신일'],
  ]),
};

const koreanDateParts = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    throw new Error('알림 실행 날짜가 올바르지 않습니다.');
  }
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type)?.value;
  return {
    dateKey: `${value('year')}-${value('month')}-${value('day')}`,
    weekday: value('weekday'),
  };
};

export function getKoreanDispatchDecision(date = new Date()) {
  const { dateKey, weekday } = koreanDateParts(date);
  if (weekday === 'Sat' || weekday === 'Sun') {
    return { shouldSend: false, reason: 'weekend', dateKey };
  }

  const holidays = KOREAN_PUBLIC_HOLIDAYS[dateKey.slice(0, 4)];
  if (!holidays) {
    return { shouldSend: false, reason: 'holiday-calendar-unavailable', dateKey };
  }

  const holidayName = holidays.get(dateKey);
  if (holidayName) {
    return { shouldSend: false, reason: 'public-holiday', holidayName, dateKey };
  }
  return { shouldSend: true, dateKey };
}
