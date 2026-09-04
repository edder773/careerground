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
  });

  it('publishes one immutable canonical value catalog', () => {
    expect(CANONICAL_DISCOVERY_ENUMS.careerScope).toEqual(['NEW_GRAD_ONLY', 'NEW_GRAD_ELIGIBLE']);
    expect(Object.isFrozen(CANONICAL_DISCOVERY_ENUMS)).toBe(true);
    expect(Object.isFrozen(CANONICAL_DISCOVERY_ENUMS.companySize)).toBe(true);
  });
});
