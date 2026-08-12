# ChatGPT Work 채용 수집 프롬프트

다음 프롬프트에서 날짜와 출처 목록을 채워 사용한다.

> 10개 이상의 공개 채용 출처에서 한국의 IT 신입 지원 가능 공고를 조사하라. 사이트 약관과 robots 정책을 존중하고 인증 우회나 대량 요청을 하지 마라. CareerGround가 직접 크롤링할 코드를 만들지 마라. 각 항목은 원문을 복제하지 말고 짧은 자체 요약과 근거 문장 요약만 작성하라. 경력직 전용은 `CAREER_ONLY`, 신입 전용은 `NEW_GRAD_ONLY`, 신입 지원 가능은 `NEW_GRAD_ELIGIBLE`로 분류하라. 회사 규모에 확실한 공개 근거가 없으면 `UNCLASSIFIED`로 두고 추측하지 마라. 조사 시각과 마지막 확인 시각은 ISO 8601 offset datetime으로 기록하라. 출력은 설명 없이 `docs/operations/job-import-schema.md`의 version 1.0 JSON 하나여야 한다. sourceCount는 실제 서로 다른 출처 수와 일치해야 한다. URL은 공개 원본 URL만 사용하고 tracking parameter를 제거하라.

생성 파일은 ADMIN이 preview의 신규/수정/중복/거절/검토 사유를 확인한 뒤에만 승인한다.
