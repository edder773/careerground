---
title: 트러블슈팅 문서 안내
date: 2026-08-12
tags: [evidence, troubleshooting]
generatedByAI: false
---

# 트러블슈팅 문서 안내

이 디렉터리는 재현 가능한 baseline, 원인, 수정 전후 검증, 회귀 테스트를 갖춘 기술 문서를 보관한다. 자동 생성 문서는 대응하는 `docs/evidence/<pr-number>/manifest.json`에 있는 사실만 사용할 수 있다.

`OPENAI_API_KEY`는 선택 사항이다. 키와 모델 변수가 모두 있으면 OpenAI가 evidence를 바탕으로 문서를 보강하고, 없으면 동일한 manifest의 변경 파일·테스트 결과·측정값만 사용해 결정론적 기록을 생성한다. 어느 경로든 실제 수정 과정의 근거는 먼저 `evidence:collect`가 만든 manifest에 기록된다.
