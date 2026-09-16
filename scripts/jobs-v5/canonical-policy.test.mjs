import { describe, expect, it } from 'vitest';
import {
  CANONICAL_DISCOVERY_ENUMS,
  inspectDiscoveryEnums,
  unsupportedDiscoveryEnumValues,
} from './canonical-policy.mjs';

describe('jobs v5 canonical enum policy', () => {
  it('normalizes known collector aliases before the protected API boundary', () => {
    expect(
      inspectDiscoveryEnums({
        careerScope: '신입',
        employmentType: '채용연계형 인턴',
        companySize: 'PUBLIC_RESEARCH_INSTITUTE',
      }),
    ).toEqual({
      values: {
        careerScope: 'NEW_GRAD_ONLY',
        employmentType: 'INTERN_TO_FULL_TIME',
        companySize: 'PUBLIC',
      },
      changes: [
        { field: 'careerScope', from: '신입', to: 'NEW_GRAD_ONLY' },
        {
          field: 'employmentType',
          from: '채용연계형 인턴',
          to: 'INTERN_TO_FULL_TIME',
        },
        { field: 'companySize', from: 'PUBLIC_RESEARCH_INSTITUTE', to: 'PUBLIC' },
      ],
      violations: [],
    });
  });

  it('reports unsupported values with their partition and item positions', () => {
    expect(
      unsupportedDiscoveryEnumValues(
        [
          {
            careerScope: 'NEW_GRAD_ONLY',
            employmentType: 'PART_TIME',
            companySize: 'LARGE',
          },
        ],
        2,
      ),
    ).toEqual([
      {
        partitionId: 2,
        itemIndex: 0,
        field: 'employmentType',
        value: 'PART_TIME',
        normalized: 'PART_TIME',
      },
    ]);
  });

  it('normalizes the observed September collector variants', () => {
    expect(
      inspectDiscoveryEnums({
        careerScope: '신입·채용연계형 인턴',
        employmentType: '신입·채용연계형 인턴',
        companySize: 'LARGE',
      }),
    ).toMatchObject({
      values: {
        careerScope: 'NEW_GRAD_ONLY',
        employmentType: 'INTERN_TO_FULL_TIME',
        companySize: 'LARGE',
      },
      violations: [],
    });
    expect(
      inspectDiscoveryEnums({
        careerScope: '신입 종합직',
        employmentType: 'FULL_TIME_OR_CONTRACT',
        companySize: 'PUBLIC',
      }),
    ).toMatchObject({
      values: {
        careerScope: 'NEW_GRAD_ONLY',
        employmentType: 'UNCONFIRMED',
        companySize: 'PUBLIC',
      },
      violations: [],
    });

    const observedSeptember4Variants = [
      {
        input: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'FULL_TIME_OR_CONVERSION_CONTRACT',
          companySize: 'LARGE',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'UNCONFIRMED',
          companySize: 'LARGE',
        },
      },
      {
        input: {
          careerScope: '인턴·재학생/최근 졸업자',
          employmentType: 'INTERNSHIP',
          companySize: '국제기구',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERNSHIP',
          companySize: 'UNCLASSIFIED',
        },
      },
      {
        input: {
          careerScope: '신입·졸업예정',
          employmentType: '신입 연구원',
          companySize: 'LARGE',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'FULL_TIME',
          companySize: 'LARGE',
        },
      },
      {
        input: {
          careerScope: '체험형 인턴',
          employmentType: 'INTERNSHIP',
          companySize: 'STARTUP',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERNSHIP',
          companySize: 'STARTUP',
        },
      },
      {
        input: {
          careerScope: '신입 인턴 포지션',
          employmentType: 'INTERNSHIP',
          companySize: 'STARTUP',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERNSHIP',
          companySize: 'STARTUP',
        },
      },
      {
        input: {
          careerScope: '신입 트랙 포함',
          employmentType: 'FULL_TIME',
          companySize: 'PUBLIC',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'FULL_TIME',
          companySize: 'PUBLIC',
        },
      },
    ];

    for (const { input, expected } of observedSeptember4Variants) {
      expect(inspectDiscoveryEnums(input)).toMatchObject({
        values: expected,
        violations: [],
      });
    }
  });

  it('publishes one immutable canonical value catalog', () => {
    expect(CANONICAL_DISCOVERY_ENUMS.careerScope).toEqual(['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE']);
    expect(Object.isFrozen(CANONICAL_DISCOVERY_ENUMS)).toBe(true);
    expect(Object.isFrozen(CANONICAL_DISCOVERY_ENUMS.companySize)).toBe(true);
  });

  it.each(['정규직 신입', '정규직(기간의 정함이 없는 근로계약)'])(
    'accepts explicit full-time collector wording: %s',
    (employmentType) => {
      expect(
        inspectDiscoveryEnums({
          careerScope: '경력무관(신입 포함)',
          employmentType,
          companySize: '미분류(근로자수 11명)',
        }),
      ).toMatchObject({
        values: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'FULL_TIME',
          companySize: 'UNCLASSIFIED',
        },
        violations: [],
      });
    },
  );

  it('does not infer an employment contract or company size from unrelated evidence', () => {
    expect(
      inspectDiscoveryEnums({
        careerScope: '신입',
        employmentType: '신입(계약형태 미표기)',
        companySize: '미분류(근로자수 10000명)',
      }),
    ).toMatchObject({
      values: {
        careerScope: 'NEW_GRAD_ONLY',
        employmentType: 'UNCONFIRMED',
        companySize: 'UNCLASSIFIED',
      },
      violations: [],
    });
  });

  it('normalizes the reviewed September 14 collector descriptions without widening inference', () => {
    const reviewed = [
      {
        input: {
          careerScope: '신입·졸업예정자 가능',
          employmentType: '정규직(수습 3개월)',
          companySize: '중견기업(301~500명)',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'FULL_TIME',
          companySize: 'MID',
        },
      },
      {
        input: {
          careerScope: '채용연계형 인턴·신입 지원 가능',
          employmentType: '인턴(6개월, 정규직 전환 기회)',
          companySize: '중견기업(747명)',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'INTERN_TO_FULL_TIME',
          companySize: 'MID',
        },
      },
      {
        input: {
          careerScope: '신입 지원 가능·경력 연수 제한 없음',
          employmentType: '정규직(일반직 5급)',
          companySize: '중소기업(89명)',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'FULL_TIME',
          companySize: 'SMALL',
        },
      },
      {
        input: {
          careerScope: '인턴/최근 졸업자',
          employmentType: '인턴(풀타임)',
          companySize: 'UNCLASSIFIED',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERNSHIP',
          companySize: 'UNCLASSIFIED',
        },
      },
      {
        input: {
          careerScope: '신입+경력(청년인턴)',
          employmentType: '체험형 청년인턴',
          companySize: 'PUBLIC',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERNSHIP',
          companySize: 'PUBLIC',
        },
      },
      {
        input: {
          careerScope: '대졸수준 신입',
          employmentType: '기간의 정함이 없는 근로계약',
          companySize: 'LARGE',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'FULL_TIME',
          companySize: 'LARGE',
        },
      },
    ];

    for (const { input, expected } of reviewed) {
      expect(inspectDiscoveryEnums(input)).toMatchObject({
        values: expected,
        violations: [],
      });
    }

    expect(
      inspectDiscoveryEnums({
        careerScope: '경력자 우대',
        employmentType: '근무 조건 협의',
        companySize: '300명 이상',
      }).violations.map(({ field }) => field),
    ).toEqual(['careerScope', 'employmentType']);
    expect(
      inspectDiscoveryEnums({
        careerScope: 'NEW_GRAD_ELIGIBLE',
        employmentType: 'INTERNSHIP',
        companySize: '300명 이상',
      }).values.companySize,
    ).toBe('UNCLASSIFIED');
  });

  it('still rejects unreviewed compound descriptions instead of guessing eligibility', () => {
    expect(
      inspectDiscoveryEnums({
        careerScope: '경력무관(경력자만 지원)',
        employmentType: '정규직 또는 프리랜서',
        companySize: '미분류(대기업 추정)',
      }).violations.map(({ field }) => field),
    ).toEqual(['careerScope', 'employmentType', 'companySize']);
  });

  it('normalizes the reviewed September 15 collector descriptions conservatively', () => {
    const reviewed = [
      {
        input: {
          careerScope: '신입/경력 중 신입 지원 직무 포함',
          employmentType: '정규직·계약직',
          companySize: '중기업',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'UNCONFIRMED',
          companySize: 'SMALL',
        },
      },
      {
        input: {
          careerScope: "Intern; enrolled or recently graduated master's students eligible",
          employmentType: 'Full-time internship',
          companySize: '300+ employees',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERNSHIP',
          companySize: 'UNCLASSIFIED',
        },
      },
      {
        input: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: '신입/경력 공채 (신입 트랙)',
          companySize: 'Large enterprise (10,406 employees)',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'UNCONFIRMED',
          companySize: 'LARGE',
        },
      },
      {
        input: {
          careerScope: '신입/경력 중 신입 트랙',
          employmentType: '신입/경력',
          companySize: 'Mid-sized enterprise (430 employees)',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'UNCONFIRMED',
          companySize: 'MID',
        },
      },
      {
        input: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: '청년인턴(채용형)',
          companySize: 'Public corporation',
        },
        expected: {
          careerScope: 'NEW_GRAD_ELIGIBLE',
          employmentType: 'INTERN_TO_FULL_TIME',
          companySize: 'PUBLIC',
        },
      },
      {
        input: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'FULL_TIME',
          companySize: 'Financial institution',
        },
        expected: {
          careerScope: 'NEW_GRAD_ONLY',
          employmentType: 'FULL_TIME',
          companySize: 'UNCLASSIFIED',
        },
      },
    ];

    for (const { input, expected } of reviewed) {
      expect(inspectDiscoveryEnums(input)).toMatchObject({
        values: expected,
        violations: [],
      });
    }
  });
});
