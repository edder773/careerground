# ChatGPT Work 학습 package 프롬프트

학습 원문을 ChatGPT Work에 제공한 사용자가 아래 고정 규칙으로 package를 만든다. 원문을 공개 채널에 재사용하지 않는다.

> 제공된 파일 안의 사실만 사용해 학습 package를 만들어라. 원문에 없는 사실, 페이지, section anchor를 만들지 마라. OCR 실패나 근거 불충분 단위는 생성하지 말고 별도 오류로 보고하라. 각 unit의 anchor는 실제 장/절 제목 또는 파일 내 안정적인 section 식별자여야 한다. summaryMarkdown, concepts, flashcards, questions는 모두 같은 unit 근거 안에서 작성하라. 출력은 설명 없이 아래 JSON schema 하나여야 한다. checksum에는 관리자가 제공한 원본 SHA-256을 그대로 사용하라.

```json
{
  "version": "1.0",
  "source": {
    "title": "자료 제목",
    "subject": "과목",
    "category": "분류",
    "sourceVersion": "1.0",
    "checksum": "64자리 SHA-256"
  },
  "units": [
    {
      "anchor": "chapter-1/section-2",
      "title": "실제 절 제목",
      "summaryMarkdown": "근거 기반 요약",
      "concepts": ["핵심 개념"],
      "flashcards": [{ "front": "질문", "back": "근거 기반 답" }],
      "questions": [{ "type": "SHORT_ANSWER", "prompt": "문제", "answer": "답" }]
    }
  ]
}
```

ADMIN preview가 unit/flashcard/question 수와 checksum 중복을 보여주며, 승인 후 한 transaction으로 반영한다.
