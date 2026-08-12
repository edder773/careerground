const patterns: Array<[RegExp, string]> = [
  [/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]'],
  [/\b(?:sk-[A-Za-z0-9_-]{16,}|gh[oprsu]_[A-Za-z0-9_]{16,})\b/g, '[REDACTED_TOKEN]'],
  [
    /https?:\/\/(?:localhost|127\.0\.0\.1|[\w-]+\.internal)(?::\d+)?\S*/gi,
    '[REDACTED_INTERNAL_URL]',
  ],
  [/(password|secret|token)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]'],
];

export function redact(input: string) {
  return patterns.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    input,
  );
}

export function scanSensitive(input: string) {
  return patterns.flatMap(([pattern]) =>
    [...input.matchAll(new RegExp(pattern.source, pattern.flags))].map((match) => match[0]),
  );
}
