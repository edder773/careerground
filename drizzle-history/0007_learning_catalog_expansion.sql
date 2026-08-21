UPDATE users SET ranking_opt_in = 1;--> statement-breakpoint
INSERT OR REPLACE INTO learning_sources
     (id, title, subject, category, status, created_at, updated_at)
   VALUES
     ('source-statistics-day1', '데이터 분석 기초: 변수에서 가설검정까지', '데이터 분석 및 AIOps', '기초통계', 'READY', '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day1-01', 'source-statistics-day1', 'statistical-thinking', '통계는 숫자가 아니라 판단의 과정이다', '## 이 단원의 목표

통계를 계산 공식이 아니라 **자료를 모으고, 요약하고, 불확실성을 고려해 판단하는 과정**으로 이해합니다.

### 왜 통계를 배우는가

같은 숫자도 표본을 어떻게 골랐는지, 어떤 비교 기준을 썼는지에 따라 결론이 달라집니다. 상관관계를 원인으로 단정하거나 평균만 보고 집단 전체를 설명하면 그럴듯하지만 잘못된 주장을 만들 수 있습니다.

### 분석 전 세 질문

1. 무엇을 알고 싶은가?
2. 그 질문을 대표하는 데이터인가?
3. 어떤 불확실성과 반례가 남는가?

### 실무 습관

- 결론보다 데이터의 수집 경로를 먼저 확인합니다.
- 평균과 함께 분포와 표본 수를 봅니다.
- 관찰한 관계와 원인 설명을 구분합니다.
- 숫자는 의사결정을 돕는 근거이지 결론 그 자체가 아닙니다.', '["통계적 사고","대표성","불확실성","상관과 인과"]', 0, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-1-1', 'unit-statistics-day1-01', '통계 분석을 시작할 때 계산보다 먼저 확인할 것은?', '분석 질문, 데이터가 질문을 대표하는지, 수집 과정에 편향이 없는지를 먼저 확인합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-1-2', 'unit-statistics-day1-01', '상관관계가 관찰됐을 때 바로 인과관계라고 말할 수 없는 이유는?', '우연, 숨은 변수, 표본 편향 등 다른 설명이 남아 있기 때문입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day1-1-1', 'unit-statistics-day1-01', '평균 매출이 올랐다는 보고를 받은 뒤 가장 먼저 할 일은 무엇인가요?

선택지: 성과가 개선됐다고 바로 발표한다. / 같은 기간과 집단을 비교했는지, 분포와 표본 수가 어떻게 변했는지 확인한다. / 평균을 한 번 더 계산한다.', '같은 기간과 집단을 비교했는지, 분포와 표본 수가 어떻게 변했는지 확인한다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day1-02', 'source-statistics-day1', 'variables-and-scales', '변수의 종류가 분석 방법을 결정한다', '## 이 단원의 목표

변수를 범주형과 수치형으로 구분하고, 측정 척도에 맞는 연산과 요약 방법을 선택합니다.

### 데이터 형태

- **범주형**: 성별, 지역, 직무처럼 집단을 구분합니다. 명목형은 순서가 없고, 순서형은 만족도 단계처럼 순서만 의미가 있습니다.
- **수치형**: 개수처럼 셀 수 있는 이산형과 키·시간처럼 연속적으로 측정하는 연속형이 있습니다.

### 측정 척도

- **명목척도**: 같고 다름만 비교
- **서열척도**: 순서 비교 가능
- **등간척도**: 간격 비교 가능, 절대 영점 없음
- **비율척도**: 간격과 비율 모두 해석 가능

### 역할에 따른 변수

독립변수는 설명에 사용하고, 종속변수는 설명하거나 예측하려는 결과입니다. 통제변수는 두 변수의 관계를 흐릴 수 있는 다른 영향을 관리합니다.

척도와 역할을 먼저 정하면 평균, 빈도표, 상관분석, 회귀분석 중 무엇이 가능한지 자연스럽게 좁혀집니다.', '["범주형","수치형","측정 척도","독립변수","종속변수"]', 1, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-2-1', 'unit-statistics-day1-02', '만족도 1~5점은 보통 어떤 척도로 해석하나요?', '순서는 있지만 각 점수 사이 간격이 반드시 같다고 보장할 수 없는 서열척도입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-2-2', 'unit-statistics-day1-02', '독립변수와 종속변수의 차이는?', '독립변수는 결과를 설명하는 입력이고, 종속변수는 설명하거나 예측하려는 결과입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day1-2-1', 'unit-statistics-day1-02', '다음 중 비율척도에 가장 가까운 변수는 무엇인가요?

선택지: 부서명 / 만족도 순위 / 섭씨 온도 / 처리 시간(초)', '처리 시간(초)', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day1-03', 'source-statistics-day1', 'descriptive-statistics', '중심, 퍼짐, 모양을 함께 읽는다', '## 이 단원의 목표

데이터를 하나의 평균으로 축약하지 않고 중심, 퍼짐, 분포 모양을 함께 설명합니다.

### 중심을 나타내는 값

- **평균**: 모든 값을 반영하지만 이상치에 민감합니다.
- **중앙값**: 순서의 가운데 값으로 치우친 분포에 강합니다.
- **최빈값**: 가장 자주 나타나는 값으로 범주형에도 사용할 수 있습니다.

### 퍼짐을 나타내는 값

범위, 분산, 표준편차는 값이 중심에서 얼마나 흩어졌는지 보여줍니다. 사분위수 범위(IQR)는 가운데 50%의 폭이며 상자그림에서 이상치를 찾는 데 유용합니다. 단위가 다른 집단의 상대적 변동은 변동계수로 비교할 수 있습니다.

### 모양을 나타내는 값

왜도는 좌우 비대칭, 첨도는 꼬리와 극단값의 특성을 설명합니다. 히스토그램이나 상자그림을 함께 보면 숫자만으로 놓치기 쉬운 여러 봉우리, 치우침, 이상치를 발견할 수 있습니다.

### 보고 템플릿

`중앙값 12분, IQR 8~19분이며 오른쪽 꼬리가 길다.`처럼 중심·퍼짐·모양을 한 문장에 담습니다.', '["평균","중앙값","표준편차","IQR","왜도","첨도"]', 2, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-3-1', 'unit-statistics-day1-03', '소득처럼 오른쪽으로 크게 치우친 데이터의 대표값으로 중앙값이 유용한 이유는?', '매우 큰 이상치가 평균을 끌어올리는 영향을 덜 받기 때문입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-3-2', 'unit-statistics-day1-03', 'IQR은 데이터의 어느 구간을 나타내나요?', '1사분위수부터 3사분위수까지, 즉 가운데 50%의 범위를 나타냅니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day1-3-1', 'unit-statistics-day1-03', '서비스 응답시간 분포를 보고할 때 평균 외에 함께 제시할 정보 두 가지를 써보세요.', '예: 중앙값, 표준편차 또는 IQR, 표본 수, 히스토그램의 치우침, 이상치 중 두 가지', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day1-04', 'source-statistics-day1', 'sampling-and-probability', '표본과 확률변수로 불확실성을 표현한다', '## 이 단원의 목표

모집단과 표본의 관계, 대표성, 표본 편향, 확률변수와 확률분포를 연결해 이해합니다.

### 모집단과 표본

모집단은 알고 싶은 전체 대상이고 표본은 실제로 관찰한 일부입니다. 표본 통계량으로 모집단의 모수를 추정하려면 표본이 충분히 대표적이어야 합니다. 편의 표본, 무응답, 생존자 편향은 표본 수가 커도 잘못된 결론을 만들 수 있습니다.

### 자료 수집 방식

횡단면 자료는 한 시점의 여러 대상을, 시계열 자료는 시간에 따른 변화를, 패널 자료는 여러 대상을 시간에 따라 반복 관찰합니다. 질문과 수집 구조가 맞아야 분석도 맞습니다.

### 확률변수

실험 결과를 숫자에 대응시킨 것이 확률변수입니다. 이산형은 확률질량함수(PMF), 연속형은 확률밀도함수(PDF)로 분포를 표현합니다. 기대값은 장기적으로 관찰될 평균적인 수준입니다.

히스토그램은 관측 데이터의 모양이고, 확률분포는 가능한 값과 그 가능성을 설명하는 모델이라는 차이를 기억합니다.', '["모집단","표본","표본 편향","확률변수","PMF","PDF","기대값"]', 3, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-4-1', 'unit-statistics-day1-04', '표본 수가 매우 크면 대표성 문제는 자동으로 해결되나요?', '아닙니다. 선택 과정이 편향돼 있으면 큰 표본도 모집단을 잘못 대표할 수 있습니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-4-2', 'unit-statistics-day1-04', 'PMF와 PDF의 주된 적용 대상은?', 'PMF는 이산확률변수, PDF는 연속확률변수의 분포를 표현합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day1-4-1', 'unit-statistics-day1-04', '앱을 삭제하지 않은 사용자만 분석해 만족도가 높다고 결론 내린 경우 가장 가까운 문제는?

선택지: 생존자 편향 / 단순 무작위 표집 / 중심극한정리', '생존자 편향', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day1-05', 'source-statistics-day1', 'normal-clt-standard-error', '정규분포와 중심극한정리를 구분한다', '## 이 단원의 목표

정규분포, 표준점수, 큰 수의 법칙, 중심극한정리, 표준오차를 서로 혼동하지 않고 설명합니다.

### 정규분포와 표준화

정규분포는 평균을 중심으로 대칭인 종 모양 분포입니다. 표준점수 `z = (x - 평균) / 표준편차`는 관측값이 평균에서 표준편차 몇 배만큼 떨어졌는지 나타냅니다. 68-95-99.7 규칙은 정규분포에서 범위를 빠르게 해석하는 근사 규칙입니다.

### 큰 수의 법칙과 중심극한정리

- **큰 수의 법칙**: 반복 횟수가 늘면 표본평균이 기대값에 가까워집니다.
- **중심극한정리**: 조건이 맞고 표본 크기가 충분하면 표본평균의 분포가 정규분포에 가까워집니다. 원자료 자체가 정규분포가 된다는 뜻은 아닙니다.

### 표준편차와 표준오차

표준편차는 개별 데이터의 흩어짐, 표준오차 `s / √n`은 표본평균 추정의 불확실성입니다. 표본 수가 커질수록 표준오차는 작아집니다.', '["정규분포","Z-score","큰 수의 법칙","중심극한정리","표준오차"]', 4, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-5-1', 'unit-statistics-day1-05', '중심극한정리가 정규분포에 가깝게 만든다고 설명하는 대상은?', '원자료가 아니라 반복 표집으로 얻은 표본평균의 분포입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-5-2', 'unit-statistics-day1-05', '표준편차와 표준오차의 차이는?', '표준편차는 관측값의 흩어짐, 표준오차는 표본 통계량 추정의 불확실성을 나타냅니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day1-5-1', 'unit-statistics-day1-05', '표본 수를 4배로 늘리면 다른 조건이 같을 때 평균의 표준오차는 대략 어떻게 되나요?

선택지: 4배가 된다. / 2배가 된다. / 절반이 된다. / 변하지 않는다.', '절반이 된다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day1-06', 'source-statistics-day1', 'hypothesis-testing', '가설검정은 효과의 진위를 판결하는 기계가 아니다', '## 이 단원의 목표

귀무가설, 대립가설, 유의수준, p-value, 단측·양측 검정의 의미를 올바르게 해석합니다.

### 검정의 흐름

1. 비교할 귀무가설과 대립가설을 정합니다.
2. 자료 형태와 연구 질문에 맞는 검정통계량을 선택합니다.
3. 귀무가설이 참이라는 가정 아래 관측 결과보다 극단적인 결과의 가능성인 p-value를 계산합니다.
4. 미리 정한 유의수준과 비교해 귀무가설을 기각할지 결정합니다.

### 자주 하는 오해

- p-value는 귀무가설이 참일 확률이 아닙니다.
- 통계적으로 유의하다고 실무적으로 큰 효과라는 뜻은 아닙니다.
- 유의하지 않다는 결과가 효과가 없음을 증명하지는 않습니다.
- 분석 후 유리한 가설만 고르거나 반복 검정하면 거짓 양성이 늘어납니다.

### 검정 선택의 출발점

두 집단 평균은 t-검정, 두 범주형 변수의 관계는 카이제곱 검정, 세 집단 이상 평균은 분산분석을 고려합니다. 실제 적용 전에는 독립성, 분포, 분산 등 가정을 확인해야 합니다.', '["귀무가설","대립가설","p-value","유의수준","단측검정","양측검정"]', 5, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-6-1', 'unit-statistics-day1-06', 'p-value가 0.03이라는 말의 올바른 해석은?', '귀무가설이 참이라고 가정할 때 현재와 같거나 더 극단적인 결과가 관측될 확률이 3%라는 뜻입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day1-6-2', 'unit-statistics-day1-06', '통계적 유의성과 실무적 중요성을 따로 봐야 하는 이유는?', '표본이 크면 매우 작은 차이도 유의할 수 있으므로 효과 크기와 비용·가치를 함께 봐야 합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day1-6-1', 'unit-statistics-day1-06', 'p-value가 유의수준보다 작을 때 가장 적절한 표현은?

선택지: 귀무가설이 거짓일 확률이 높다. / 대립가설이 반드시 참이다. / 정한 기준에서 귀무가설을 기각할 근거가 있다.', '정한 기준에서 귀무가설을 기각할 근거가 있다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_sources
     (id, title, subject, category, status, created_at, updated_at)
   VALUES
     ('source-statistics-day2', '데이터 관계 읽기: 상관과 회귀', '데이터 분석 및 AIOps', '회귀분석', 'READY', '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day2-01', 'source-statistics-day2', 'scatterplot-and-correlation', '상관계수보다 산점도를 먼저 본다', '## 이 단원의 목표

두 수치형 변수의 관계를 산점도와 상관계수로 설명하고, 방향·강도·형태를 구분합니다.

### 산점도가 먼저인 이유

상관계수 하나만으로는 비선형 관계, 여러 집단, 이상치를 놓칠 수 있습니다. 산점도에서 다음을 먼저 확인합니다.

- 증가 또는 감소하는 방향
- 점들이 직선 주변에 모이는 강도
- 곡선이나 구간별 패턴
- 집단 분리와 이상치

### 상관계수 r

상관계수는 -1에서 1 사이이며 선형 관계의 방향과 강도를 요약합니다. 부호는 방향, 절댓값은 선형 관계의 강도를 나타냅니다. 0에 가까워도 비선형 관계가 존재할 수 있고, 변수의 단위를 바꿔도 상관계수는 변하지 않습니다.

### 분석 순서

`산점도 확인 → 데이터 품질과 이상치 확인 → 상관계수 계산 → 맥락과 함께 해석` 순서를 지킵니다.', '["산점도","상관계수","선형 관계","방향","강도"]', 0, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-1-1', 'unit-statistics-day2-01', '상관계수의 부호와 절댓값은 각각 무엇을 뜻하나요?', '부호는 관계의 방향, 절댓값은 선형 관계의 강도를 뜻합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-1-2', 'unit-statistics-day2-01', '상관계수가 0이면 두 변수는 완전히 무관한가요?', '아닙니다. 선형 관계가 약하다는 뜻이며 강한 비선형 관계가 있을 수 있습니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day2-1-1', 'unit-statistics-day2-01', '상관계수를 계산하기 전에 가장 먼저 할 일은?

선택지: 인과관계를 선언한다. / 산점도로 관계의 형태와 이상치를 확인한다. / 변수 단위를 같게 만든다.', '산점도로 관계의 형태와 이상치를 확인한다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day2-02', 'source-statistics-day2', 'correlation-pitfalls', '상관관계의 함정을 피한다', '## 이 단원의 목표

이상치, 범위 제한, 집단 혼합, 허위 상관이 상관계수 해석을 어떻게 바꾸는지 이해합니다.

### 대표적인 함정

- **이상치**: 한두 점이 상관계수를 크게 만들거나 없앨 수 있습니다.
- **범위 제한**: 특정 구간만 뽑으면 전체 관계보다 약하거나 다르게 보입니다.
- **집단 혼합**: 집단별 관계와 전체 관계의 방향이 달라지는 심슨의 역설이 생길 수 있습니다.
- **허위 상관**: 시간 추세나 제3의 변수가 두 변수를 함께 움직일 수 있습니다.

### 인과관계를 말하려면

시간적 선후, 가능한 메커니즘, 교란변수 통제, 실험 또는 준실험 근거가 필요합니다. 상관계수만으로 원인을 확정하지 않습니다.

### 안전한 표현

`두 변수 사이에 양의 선형 관계가 관찰됐지만 원인 관계는 확인되지 않았다.`처럼 관찰과 해석의 한계를 함께 씁니다.', '["이상치","범위 제한","심슨의 역설","허위 상관","인과관계"]', 1, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-2-1', 'unit-statistics-day2-02', '심슨의 역설은 무엇인가요?', '집단별로 본 관계와 집단을 합쳐 본 전체 관계의 방향이나 크기가 달라지는 현상입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-2-2', 'unit-statistics-day2-02', '시간에 따라 함께 증가한 두 지표의 상관이 높을 때 확인할 것은?', '공통 시간 추세나 제3의 요인이 두 지표를 함께 변화시켰는지 확인합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day2-2-1', 'unit-statistics-day2-02', '상관관계 보고서에 인과 해석을 제한하는 문장을 한 줄로 작성해보세요.', '예: 두 변수의 관계는 관찰됐지만 교란변수와 시간적 선후가 확인되지 않아 인과관계로 해석할 수 없다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day2-03', 'source-statistics-day2', 'simple-linear-regression', '회귀선은 오차를 가장 작게 만드는 요약선이다', '## 이 단원의 목표

단순선형회귀의 예측식, 기울기, 절편, 잔차, 최소제곱법을 직관적으로 이해합니다.

### 평균에서 조건부 예측으로

모든 대상에 전체 평균을 예측하는 것보다 입력값 x에 따라 달라지는 평균 y를 추정하면 오차를 줄일 수 있습니다. 단순선형회귀는 `예측값 = 절편 + 기울기 × x`로 이 관계를 나타냅니다.

- **기울기**: x가 한 단위 증가할 때 예측 y가 평균적으로 얼마나 변하는가
- **절편**: x가 0일 때의 예측값. 데이터 범위 밖이면 실질적 의미가 없을 수 있음
- **잔차**: 실제값에서 예측값을 뺀 차이

### 최소제곱법

양수와 음수 잔차가 상쇄되지 않도록 잔차를 제곱해 더하고, 그 합이 가장 작은 직선을 선택합니다. 큰 오차에 더 큰 벌점을 주기 때문에 이상치의 영향도 큽니다.

회귀식은 관측 범위 안에서 관계를 요약하는 도구입니다. 데이터 범위를 벗어난 외삽은 별도 근거 없이 사용하지 않습니다.', '["회귀선","기울기","절편","잔차","최소제곱법","외삽"]', 2, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-3-1', 'unit-statistics-day2-03', '회귀분석에서 잔차는 무엇인가요?', '관측한 실제값에서 회귀모형의 예측값을 뺀 차이입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-3-2', 'unit-statistics-day2-03', '최소제곱법이 잔차를 제곱하는 주요 이유는?', '양수와 음수 오차의 상쇄를 막고 큰 오차에 더 큰 벌점을 주기 위해서입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day2-3-1', 'unit-statistics-day2-03', '회귀식의 기울기가 2.5라는 말의 일반적인 해석은?

선택지: x가 0일 때 y가 2.5다. / x가 1 증가할 때 예측 y가 평균적으로 2.5 증가한다. / 모형의 오차가 2.5%다.', 'x가 1 증가할 때 예측 y가 평균적으로 2.5 증가한다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day2-04', 'source-statistics-day2', 'regression-evaluation', '계수, p-value, R², RMSE는 서로 다른 질문에 답한다', '## 이 단원의 목표

회귀 결과표의 주요 지표가 무엇을 설명하고 무엇을 설명하지 않는지 구분합니다.

### 지표별 질문

- **회귀계수**: 입력이 변할 때 예측 결과의 방향과 크기는?
- **p-value**: 정한 가정 아래 계수가 0과 다르다는 통계적 근거가 있는가?
- **R²**: 결과값의 전체 변동 중 모형이 설명한 비율은?
- **Adjusted R²**: 변수를 늘린 대가를 반영한 설명력은?
- **RMSE**: 예측이 실제값에서 원래 단위로 대략 얼마나 벗어나는가?
- **F-test**: 설명변수 전체가 포함된 모형이 기본 모형보다 유용한가?

### 함께 읽는 법

R²가 높아도 미래 예측이 좋거나 인과관계가 입증된 것은 아닙니다. p-value가 작아도 효과 크기가 실무적으로 작을 수 있습니다. RMSE는 목표값 단위와 비교 기준이 있어야 의미가 생깁니다.

결과를 보고할 때는 계수와 불확실성, 적합도, 예측 오차, 데이터 범위를 함께 제시합니다.', '["회귀계수","p-value","R-squared","Adjusted R-squared","RMSE","F-test"]', 3, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-4-1', 'unit-statistics-day2-04', 'R²가 높으면 인과관계가 증명되나요?', '아닙니다. 관측 데이터에서 변동을 잘 설명한다는 뜻일 뿐 인과성과 일반화를 보장하지 않습니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-4-2', 'unit-statistics-day2-04', 'RMSE가 특히 해석하기 쉬운 이유는?', '목표 변수와 같은 단위로 평균적인 예측 오차 규모를 보여주기 때문입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day2-4-1', 'unit-statistics-day2-04', '예측값이 실제값에서 원래 단위로 얼마나 벗어나는지 알고 싶을 때 볼 지표는?

선택지: 회귀계수 / p-value / R² / RMSE', 'RMSE', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-statistics-day2-05', 'source-statistics-day2', 'regression-assumptions', '잔차로 선형회귀의 가정을 점검한다', '## 이 단원의 목표

선형성, 독립성, 등분산성, 정규성, 다중공선성 가정을 잔차와 진단 지표로 확인합니다.

### 주요 가정

- **선형성**: 입력과 평균 결과의 관계를 직선으로 설명할 수 있어야 합니다. 잔차에 곡선 패턴이 남으면 변환이나 비선형 모형을 검토합니다.
- **독립성**: 잔차가 시간이나 순서에 따라 연결되지 않아야 합니다. 시계열 자료는 자기상관을 확인합니다.
- **등분산성**: 예측값 크기에 따라 잔차의 퍼짐이 체계적으로 커지거나 작아지지 않아야 합니다.
- **정규성**: 추론에 사용하는 잔차 분포가 지나치게 비정상적이지 않은지 확인합니다.
- **다중공선성**: 여러 설명변수가 거의 같은 정보를 담아 계수 추정이 불안정해지지 않는지 확인합니다.

### 진단과 대응

잔차-예측값 그림, Q-Q plot, 시간 순서 그래프, VIF 등을 사용합니다. 가정 위반을 발견하면 변수 변환, 상호작용·비선형 항 추가, 강건 표준오차, 정규화, 다른 모형을 검토합니다.

좋은 모형은 학습 데이터에만 잘 맞는 모형이 아니라 새 데이터에서도 오차가 안정적인 모형입니다.', '["선형성","독립성","등분산성","정규성","다중공선성","강건성"]', 4, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-5-1', 'unit-statistics-day2-05', '잔차 그림이 깔때기 모양이면 어떤 가정을 의심하나요?', '예측값에 따라 오차의 분산이 달라지는 이분산성, 즉 등분산성 위반을 의심합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-statistics-day2-5-2', 'unit-statistics-day2-05', '다중공선성이 심하면 어떤 문제가 생기나요?', '설명변수별 계수 추정이 불안정해지고 부호나 크기 해석이 민감해질 수 있습니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-statistics-day2-5-1', 'unit-statistics-day2-05', '잔차에 곡선 패턴이 남아 있을 때 고려할 대응 두 가지를 써보세요.', '예: 변수 변환, 다항항이나 비선형 항 추가, 비선형 모형 사용 중 두 가지', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_sources
     (id, title, subject, category, status, created_at, updated_at)
   VALUES
     ('source-git-ai-environment', '개발 입문: Git, 환경 구성, AI 코딩', '프로그래밍 기초', '개발 환경과 협업', 'READY', '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-git-ai-environment-01', 'source-git-ai-environment', 'product-and-operations-vocabulary', '서비스가 만들어지고 운영되는 흐름을 읽는다', '## 이 단원의 목표

기획부터 운영까지 자주 만나는 용어를 순서와 목적 중심으로 연결합니다.

### 제품을 구체화하는 단계

와이어프레임은 화면의 구조, 목업은 시각적 완성 모습, 프로토타입은 실제 상호작용을 검증하는 모델입니다. MVP는 모든 기능을 담은 작은 제품이 아니라 **핵심 가설을 검증하는 최소 제품**입니다.

### 출시와 운영

빌드는 소스 코드를 실행 가능한 결과물로 만들고, 배포는 그 결과물을 사용자가 접근할 환경에 올립니다. 릴리스는 변경 사항을 사용자에게 공식 제공하는 결정이며 롤백은 문제가 있을 때 이전 안정 버전으로 되돌리는 대응입니다.

### 문제 대응

인시던트는 정상 사용을 방해하는 사건, 트러블슈팅은 증상에서 실제 원인을 좁혀가는 과정입니다. 로그, 재현 조건, 변경 이력, 영향 범위를 근거로 가설을 세우고 검증합니다.

용어를 단독으로 외우기보다 `기획 → 구현 → 빌드 → 배포 → 관찰 → 개선` 흐름 안에서 위치를 기억합니다.', '["Wireframe","Prototype","MVP","Build","Deploy","Release","Incident"]', 0, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-1-1', 'unit-git-ai-environment-01', '빌드와 배포의 차이는?', '빌드는 소스를 실행 가능한 결과로 만드는 과정이고, 배포는 결과물을 실행 환경에 전달하는 과정입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-1-2', 'unit-git-ai-environment-01', 'MVP의 핵심 목적은?', '최소 범위로 제품의 핵심 가치와 시장 가설을 빠르게 검증하는 것입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-git-ai-environment-1-1', 'unit-git-ai-environment-01', '운영 배포 직후 오류율이 급증했을 때 가장 직접적인 복구 행동은?

선택지: 와이어프레임을 수정한다. / 검증된 이전 버전으로 롤백한다. / MVP 범위를 늘린다.', '검증된 이전 버전으로 롤백한다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-git-ai-environment-02', 'source-git-ai-environment', 'web-system-basics', '프론트엔드와 백엔드는 API로 협업한다', '## 이 단원의 목표

웹서비스의 구성 요소와 데이터 형식, 동기·비동기 처리, 아키텍처 선택을 한 흐름으로 이해합니다.

### 역할 구분

프론트엔드는 사용자가 보는 화면과 상호작용을 담당합니다. 백엔드는 요청을 검증하고 비즈니스 규칙을 실행하며 데이터베이스와 외부 시스템을 연결합니다. API는 둘 사이에서 요청과 응답의 규칙을 정의합니다.

### 데이터와 설정

JSON은 API에서 데이터를 교환할 때 널리 쓰는 키-값 기반 형식입니다. YAML은 사람이 읽기 쉬운 설정 파일에 자주 사용되며 들여쓰기가 구조를 결정하므로 주의해야 합니다.

### 처리 방식

동기 처리는 응답을 기다린 뒤 다음 작업을 진행하고, 비동기 처리는 기다리는 동안 다른 작업을 처리합니다. 비동기는 무조건 빠른 방식이 아니라 대기 시간을 효율적으로 사용하는 구조입니다.

### 아키텍처

모놀리스는 배포와 운영이 단순하지만 규모가 커지면 책임이 얽힐 수 있습니다. 마이크로서비스는 책임과 배포를 분리하지만 네트워크, 데이터 일관성, 관찰 가능성의 복잡도가 늘어납니다. 팀과 문제 규모에 맞춰 선택합니다.', '["Frontend","Backend","API","JSON","YAML","동기","비동기","Architecture"]', 1, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-2-1', 'unit-git-ai-environment-02', 'API가 프론트엔드와 백엔드 사이에서 하는 역할은?', '어떤 요청을 보내고 어떤 응답을 받을지 데이터와 동작의 계약을 정의합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-2-2', 'unit-git-ai-environment-02', '비동기 처리가 항상 더 빠르다고 말할 수 없는 이유는?', '대기 시간을 효율적으로 쓸 수 있지만 작업 자체의 비용과 동시성 관리 복잡도는 별도로 남기 때문입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-git-ai-environment-2-1', 'unit-git-ai-environment-02', '환경 설정 파일에서 들여쓰기로 계층을 표현할 때 주로 사용하는 형식은?

선택지: JSON / YAML / HTML', 'YAML', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-git-ai-environment-03', 'source-git-ai-environment', 'development-environment', '개발 환경은 설치보다 검증이 중요하다', '## 이 단원의 목표

터미널, 런타임, 패키지 관리자, IDE를 재현 가능한 개발 환경으로 구성하고 확인합니다.

### 환경 구성의 원칙

설치 목록을 무작정 실행하기 전에 프로젝트가 요구하는 운영체제, 런타임 버전, 데이터베이스, CLI를 확인합니다. 설치 후에는 각 도구의 버전과 실제 경로를 검증하고 새 터미널에서 설정이 유지되는지 확인합니다.

### 터미널 기본기

현재 위치 확인, 파일 목록 보기, 디렉터리 이동·생성, 파일 복사·이동·삭제를 익힙니다. 삭제 명령은 현재 경로와 대상을 확인한 뒤 사용합니다.

### IDE 활용

VS Code의 탐색기, 검색, 소스 제어, 실행·디버그, 확장, 통합 터미널의 역할을 구분합니다. 명령 팔레트는 메뉴 위치를 외우는 대신 필요한 동작을 검색하는 중심 도구입니다.

### 재현 가능성 체크

- 버전 파일과 잠금 파일을 저장합니다.
- 비밀값은 환경변수로 분리합니다.
- 설치 명령과 검증 명령을 문서화합니다.
- 새 환경에서도 같은 결과가 나오는지 확인합니다.', '["Terminal","Runtime","Package Manager","IDE","버전 고정","재현 가능성"]', 2, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-3-1', 'unit-git-ai-environment-03', '도구 설치가 성공했다는 메시지만으로 충분하지 않은 이유는?', '실제 PATH에 연결된 버전과 프로젝트가 요구하는 버전이 다를 수 있어 새 터미널에서 버전 확인이 필요합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-3-2', 'unit-git-ai-environment-03', '잠금 파일을 저장소에 포함하는 이유는?', '팀과 CI가 같은 의존성 버전 조합을 재현하도록 하기 위해서입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-git-ai-environment-3-1', 'unit-git-ai-environment-03', '새 개발 환경에서 설치 완료 후 확인할 항목 두 가지를 써보세요.', '예: 런타임 버전, 실행 파일 경로, 패키지 관리자 버전, 데이터베이스 연결, 프로젝트 테스트 중 두 가지', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-git-ai-environment-04', 'source-git-ai-environment', 'git-mental-model', 'Git의 작업 영역과 이력 흐름을 이해한다', '## 이 단원의 목표

Git을 명령어 암기가 아니라 작업 트리, 스테이징 영역, 로컬 저장소, 원격 저장소 사이의 이동으로 이해합니다.

### 네 공간

1. 작업 트리에서 파일을 수정합니다.
2. `add`로 이번 커밋에 포함할 변경을 스테이징합니다.
3. `commit`으로 의미 있는 로컬 이력을 만듭니다.
4. `push`로 원격 저장소에 공유하고 `pull`로 원격 변경을 가져옵니다.

### 좋은 커밋

한 커밋은 한 가지 목적을 담고, 메시지는 무엇을 왜 바꿨는지 드러내야 합니다. 커밋 전에는 `status`와 diff를 확인해 비밀값, 생성물, 무관한 변경이 섞이지 않았는지 점검합니다.

### .gitignore

의존성 폴더, 빌드 결과, 로그, 로컬 설정, 비밀 환경 파일처럼 저장소에서 추적하지 않을 파일을 지정합니다. 이미 추적 중인 파일은 ignore 규칙만 추가해도 자동으로 사라지지 않습니다.', '["Working Tree","Staging","Commit","Remote","Push","Pull",".gitignore"]', 3, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-4-1', 'unit-git-ai-environment-04', 'Git의 스테이징 영역은 왜 필요한가요?', '작업 중인 변경 중 이번 커밋에 포함할 부분만 골라 의미 있는 이력을 만들기 위해서입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-4-2', 'unit-git-ai-environment-04', '.gitignore에 추가했는데 이미 추적 중인 파일이 계속 보이는 이유는?', 'ignore는 아직 추적하지 않은 파일에 적용되며 기존 추적 상태는 별도로 해제해야 하기 때문입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-git-ai-environment-4-1', 'unit-git-ai-environment-04', '원격에 올리기 전 이번 커밋에 포함할 변경만 선택하는 단계는?

선택지: 클론 / 스테이징 / 풀 / 롤백', '스테이징', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-git-ai-environment-05', 'source-git-ai-environment', 'git-collaboration-and-security', '브랜치와 인증을 안전하게 운영한다', '## 이 단원의 목표

브랜치, 병합, 충돌, 되돌리기, 원격 인증을 안전한 협업 흐름으로 연결합니다.

### 브랜치 전략

작업 브랜치는 main의 안정성을 지키며 독립적으로 변경을 검토하게 합니다. 작은 팀과 지속 배포 환경에서는 짧게 유지하는 기능 브랜치와 PR 중심 흐름이 관리하기 쉽습니다. 복잡한 Git Flow는 릴리스 단계가 실제로 필요한 조직에서 선택합니다.

### 충돌과 되돌리기

충돌은 같은 부분의 서로 다른 변경을 Git이 자동 선택하지 못한 상태입니다. 양쪽 의도를 확인해 최종 내용을 직접 결정하고 테스트합니다. 공유 이력에서는 기존 커밋을 지우기보다 반대 변경을 새 커밋으로 만드는 revert가 안전합니다.

### 인증과 비밀 관리

개인 액세스 토큰은 계정 비밀번호가 아니며 필요한 최소 권한과 만료 기간만 부여합니다. 토큰을 코드, 원격 URL, 셸 기록, 스크린샷에 남기지 않습니다. 가능하면 공식 CLI나 OS 자격증명 저장소를 사용합니다.

PR은 코드뿐 아니라 테스트 결과, 영향 범위, 되돌리는 방법을 공유하는 협업 단위입니다.', '["Branch","Merge","Conflict","Revert","Pull Request","PAT","최소 권한"]', 4, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-5-1', 'unit-git-ai-environment-05', '공유된 커밋을 되돌릴 때 revert가 안전한 이유는?', '기존 이력을 다시 쓰지 않고 반대 변경을 새 커밋으로 남겨 다른 사용자의 이력을 보호하기 때문입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-5-2', 'unit-git-ai-environment-05', '개인 액세스 토큰을 만들 때 지켜야 할 두 원칙은?', '필요한 최소 권한만 부여하고 적절한 만료 기간을 설정하며 안전한 자격증명 저장소에 보관합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-git-ai-environment-5-1', 'unit-git-ai-environment-05', '공유 저장소 main에 이미 반영된 문제 커밋을 안전하게 취소하는 기본 선택은?

선택지: 모든 이력을 강제로 덮어쓴다. / revert로 반대 변경 커밋을 만든다. / 저장소를 새로 만든다.', 'revert로 반대 변경 커밋을 만든다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_units
       (id, source_id, anchor, title, summary, concepts, position, published, created_at, updated_at)
     VALUES
       ('unit-git-ai-environment-06', 'source-git-ai-environment', 'ai-coding-validation-loop', 'AI 코딩은 생성보다 검증 루프가 핵심이다', '## 이 단원의 목표

AI 코딩 도구를 코드 생성기보다 요구사항 이해, 구현, 설명, 리뷰, 테스트를 반복하는 협업 도구로 사용합니다.

### 좋은 요청의 구조

실행 환경, 목표 동작, 입력과 출력, 제약, 완료 조건을 구체적으로 제공합니다. 기존 프로젝트라면 먼저 구조와 지침 파일을 읽게 하고 작은 변경 단위로 진행합니다.

### 안전한 작업 루프

1. 현재 상태와 요구사항을 확인합니다.
2. 변경 범위를 작게 정합니다.
3. 코드를 생성하거나 수정합니다.
4. diff를 읽고 설명을 요청합니다.
5. lint, 타입 검사, 테스트, 빌드를 실행합니다.
6. 실패 원인을 고친 뒤 같은 조건으로 재검증합니다.

### 사람이 확인할 것

AI가 만든 코드는 실행 가능성만으로 충분하지 않습니다. 보안, 데이터 손실 가능성, 라이선스, 성능, 사용자 의도, 예외 처리, 테스트의 빈틈을 검토합니다. 최신 도구의 명령과 옵션은 설치된 버전의 공식 도움말로 확인합니다.

좋은 결과는 긴 프롬프트 한 번이 아니라 관찰 가능한 검증 신호를 가진 짧은 반복에서 나옵니다.', '["AI Coding","요구사항","Diff Review","Test","Validation Loop","Human Review"]', 5, 1, '2026-08-13T04:00:00.000Z', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-6-1', 'unit-git-ai-environment-06', 'AI가 코드를 생성한 직후 가장 먼저 할 일은?', '변경 diff를 읽어 요구사항과 범위를 지켰는지 확인한 뒤 관련 검증을 실행합니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO flashcards
         (id, unit_id, front, back, created_at)
       VALUES
         ('flash-git-ai-environment-6-2', 'unit-git-ai-environment-06', 'AI 코딩 요청에 완료 조건이 필요한 이유는?', '어떤 결과와 테스트를 통과해야 작업이 끝나는지 사람과 도구가 같은 기준으로 판단하게 하기 위해서입니다.', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
INSERT OR REPLACE INTO learning_questions
         (id, unit_id, prompt, answer, created_at)
       VALUES
         ('question-git-ai-environment-6-1', 'unit-git-ai-environment-06', 'AI가 생성한 코드가 정상 실행됐을 때도 사람이 추가로 확인해야 하는 것은?

선택지: 출력 글자 색상만 확인한다. / 보안, 예외 처리, 데이터 손실 가능성, 요구사항 일치 여부 / 아무것도 확인하지 않는다.', '보안, 예외 처리, 데이터 손실 가능성, 요구사항 일치 여부', '2026-08-13T04:00:00.000Z');--> statement-breakpoint
PRAGMA optimize;
