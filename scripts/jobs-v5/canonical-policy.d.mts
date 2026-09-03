export type DiscoveryEnumField = 'careerScope' | 'employmentType' | 'companySize';

export type DiscoveryEnumChange = {
  field: DiscoveryEnumField;
  from: string;
  to: string;
};

export type DiscoveryEnumViolation = {
  field: DiscoveryEnumField;
  value: string;
  normalized: string;
};

export const CANONICAL_DISCOVERY_ENUMS: Readonly<Record<DiscoveryEnumField, readonly string[]>>;

export function inspectDiscoveryEnums(item?: Record<string, unknown>): {
  values: Record<DiscoveryEnumField, string>;
  changes: DiscoveryEnumChange[];
  violations: DiscoveryEnumViolation[];
};

export function unsupportedDiscoveryEnumValues(
  items: unknown,
  partitionId?: number,
): Array<DiscoveryEnumViolation & { itemIndex: number; partitionId?: number }>;
