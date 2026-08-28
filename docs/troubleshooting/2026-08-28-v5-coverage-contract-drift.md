---
title: V5 수집 결과의 sourceCoverage 계약 불일치
date: 2026-08-28
tags: [jobs, github-actions, validation, schema]
generatedByAI: false
---

# V5 수집 결과의 sourceCoverage 계약 불일치

## 현상

세 개의 schema 5.1 discovery delta가 GitHub handoff 입력 게이트를 통과했지만, 병합 전 검증 단계가 `DISCOVERY_SCHEMA_INVALID`로 중단됐다. 기준 실행에서는 PARTITION 2의 첫 coverage 원소에 canonical `sourceName`이 없어 운영 게시 단계가 실행되지 않았다.

## 원인

수집 프롬프트는 `sourceCoverage` 배열과 상태 값만 설명하고 원소의 필드 이름을 고정하지 않았다. 두 수집기는 `sourceName`을 생성했지만 하나는 의미가 같은 `source`를 생성했다. 설명 필드도 `notes`, `note`, `detail`로 달랐다. 검증기는 `sourceName`만 허용해 의미상 유효한 조사 결과를 구조 단계에서 거절했다.

```text
수집기 출력: { source, status, note }
검증기 계약: { sourceName, status, notes }
결과: DISCOVERY_SCHEMA_INVALID
```

대형 final JSON 업로드 실패는 현재 schema 2.0 운영 경로의 원인이 아니었다. 최신 경로는 세 개의 작은 discovery delta를 GitHub Actions에서 검증한 뒤 보호된 운영 endpoint에 직접 게시하므로 final JSON을 ChatGPT 연결 도구로 전달하지 않는다.

## 수정

- 프롬프트에 coverage 원소의 canonical 필드를 명시했다.
- 입력 경계에서 기존 `source`·`note`·`detail`을 canonical 필드로 제한적으로 정규화한다.
- 실제 입력에서 관찰된 한국어·legacy enum을 `careerScope`, `companySize`, `employmentType` canonical 값으로 정규화한다.
- `sourceName`과 `source`가 동시에 존재하면서 값이 다르면 계속 실패한다.
- 정규화 건수를 descriptor에 기록해 계약 이탈을 관찰할 수 있게 했다.
- Issue 생성과 라벨 추가가 각각 workflow를 시작하던 중복 경로를 제거하고 `opened`, `reopened`만 수신한다.

## 회귀 검증

동일한 비식별 fixture에서 canonical coverage, 실제 관찰된 alias coverage, 상충 alias, 부분 차단, 전체 차단, 출처 소유권 위반을 함께 검사한다. alias 입력은 canonical coverage map으로 정규화되고, 상충 입력은 `DISCOVERY_COVERAGE_INVALID`로 차단돼야 한다.
