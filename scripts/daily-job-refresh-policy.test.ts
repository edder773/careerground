import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const policyUrl = new URL('../docs/operations/daily-job-refresh-automation.md', import.meta.url);

describe('daily job refresh discovery policy', () => {
  it('requires a company-name backstop for generic recruiting titles', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('### 3.1 회사명 보완 탐색');
    expect(policy).toContain(
      '플랫폼별 키워드 탐색을 마친 뒤에는 회사명을 기준으로 한 보완 탐색을 반드시 수행한다.',
    );
    expect(policy).toContain('공식 채용 페이지와 최소 2개 공개 채용 출처에서 검색한다.');
    expect(policy).toContain('포괄 제목의 공고는 제목만으로 IT 또는 비IT를 판정하지 않는다.');
    expect(policy).toContain('`company-backstop.json`');
    expect(policy).toContain(
      '`ACTIVE_CANDIDATE`는 상세 직무와 현재 지원 가능 상태가 모두 확인된 경우에만 사용한다.',
    );
  });

  it('prevents generic-title and shallow-pagination omissions', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('키워드 검색 결과만 읽고 목록 탐색을 끝내지 않는다.');
    expect(policy).toContain('고정된 페이지 수에서 임의로 중단하지 않고');
    expect(policy).toContain('추천 공고·인기 공고·관련 공고·같은 회사 공고');
    expect(policy).toContain('`신입공채`, `공개채용`, `통합채용`');
    expect(policy).toContain('`신사업(AI/데이터·블록체인·플랫폼/IT)`');
    expect(policy).toContain('`rawCandidateCount === decidedCandidateCount`');
    expect(policy).toContain('`COMPLETED`는 `highWatermark`가 존재하고');
  });

  it('requires a sector-complete finance company backstop', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('직전에 사용자가 언급한 회사나 직전 누락 회사만 검사해서는 안 된다.');
    expect(policy).toContain('금융지주·그룹 공동채용과 각 계열사를 별도 검색 대상');
    expect(policy).toContain('금융권 대상이 0건이거나');
  });

  it('isolates uncertain jobs while deploying the verified subset', async () => {
    const policy = await readFile(policyUrl, 'utf8');

    expect(policy).toContain('불확실성은 **공고 단위로 격리**');
    expect(policy).toContain('신규 불확실 후보는 `active.json`과 마이그레이션에서 제외');
    expect(policy).toContain('운영 행은 그대로 둔다.');
    expect(policy).toContain(
      '개별 접근 실패나 신규 출처의 `INCOMPLETE` 자체는 전체 중단 사유가 아니다.',
    );
    expect(policy).toContain('별도 확인을 기다리지 않는다.');
  });
});
