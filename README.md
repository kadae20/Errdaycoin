# BuyOrSell 퀴즈 📈

Next.js 14, TypeScript, Supabase로 구축된 프로덕션 레디 교육용 트레이딩 게임입니다. 플레이어는 과거 캔들스틱 차트의 방향을 예측하고 주간 리더보드에서 경쟁합니다.

## 🚀 주요 기능

- **차트 방향 퀴즈**: 실제 시장 데이터로 상승/하락/횡보 예측
- **실시간 리더보드**: 점수 시스템이 있는 주간 순위
- **다국어 지원**: 한국어, 영어, 스페인어, 일본어 (i18next)
- **인증 시스템**: 매직 링크 로그인 + 익명 게스트 모드
- **인터랙티브 차트**: TradingView Lightweight Charts 통합
- **점수 공유**: 소셜 미디어 공유용 OpenGraph 이미지
- **모바일 우선 디자인**: 반응형 TailwindCSS UI
- **엣지 최적화 API**: Vercel Edge Runtime으로 빠른 성능

## 🛠️ 기술 스택

- **프론트엔드**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **백엔드**: Supabase (Auth + Postgres + RLS)
- **차트**: TradingView Lightweight Charts
- **상태 관리**: TanStack Query (React Query)
- **국제화**: i18next + react-i18next
- **테스팅**: Jest + React Testing Library
- **배포**: Vercel

## 🏃‍♂️ 빠른 시작

### 사전 요구사항

- Node.js 18+
- pnpm (권장) 또는 npm
- Supabase 계정

### 1. 클론 및 설치

```bash
git clone <repository-url>
cd buyorsell-quiz
pnpm install
```

### 2. 환경 설정

환경 변수 템플릿 복사:

```bash
cp env.example .env.local
```

Supabase 자격 증명 입력:

```env
# 사이트 설정
NEXT_PUBLIC_SITE_NAME="BuyOrSell Quiz"
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=ko,en,es,ja

# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. 데이터베이스 설정

데이터베이스 마이그레이션 실행:

```bash
# Supabase CLI 사용
supabase migration up

# 또는 supabase/migrations/001_initial_schema.sql 파일을 수동으로 실행
```

### 4. 샘플 데이터 시드

```bash
pnpm run seed
```

제공된 BTC/ETH 과거 데이터로 샘플 퀴즈를 생성합니다.

### 5. 개발 시작

```bash
pnpm dev
```

http://localhost:3000 에서 앱이 실행되는 것을 확인하세요!

## 📊 데이터베이스 스키마

### 핵심 테이블

- **`app_user`**: 선택적 핸들이 있는 사용자 프로필
- **`quiz_bank`**: 답이 있는 과거 차트 세그먼트
- **`quiz_attempt`**: 사용자 시도 및 점수
- **`ratelimit_hits`**: API 속도 제한
- **`weekly_leaderboard`** (뷰): 계산된 주간 순위

### 주요 특징

- 행 수준 보안(RLS) 활성화
- 자동 사용자/시도 관계
- 성능을 위한 최적화된 인덱스
- 실시간 리더보드 계산

## 🎮 게임 메커니즘

### 점수 시스템

- **기본 점수**: 정답 시 100점
- **속도 보너스**: 빠른 응답 시 최대 50점
- **난이도 배수**: 시장 변동성에 따라 1배~1.5배
- **최종 점수**: `(기본 + 속도) × 난이도`

### 난이도 계산

다음 요소로 자동 결정:
- 가격 변동성 (표준편차)
- 심지-몸통 비율 (시장 우유부단함)
- 1-3 난이도 레벨로 결합

## 🌍 국제화

자동 브라우저 감지로 4개 언어 지원:

- 🇰🇷 한국어 (기본)
- 🇺🇸 영어
- 🇪🇸 스페인어
- 🇯🇵 일본어

새 언어 추가 방법:
1. `lib/i18n/locales/{lang}.json` 생성
2. `SupportedLanguages` 배열에 추가
3. 환경 변수 업데이트

## 🔒 보안 기능

- **속도 제한**: API 엔드포인트 보호 (30-15 req/min)
- **행 수준 보안**: 데이터베이스 접근 제어
- **입력 검증**: Zod 스키마 검증
- **CORS 보호**: 적절한 헤더 구성
- **XSS 보호**: 콘텐츠 보안 정책 헤더

## 📱 API 엔드포인트

### `GET /api/quiz/next`
- **쿼리**: `?difficulty=1&lang=ko`
- **응답**: 미리보기 캔들이 있는 퀴즈
- **캐시**: 60초 stale-while-revalidate

### `POST /api/quiz/answer`
- **본문**: `{ quizId, choice, tookMs }`
- **응답**: 점수, 정답 여부, 공개 캔들
- **인증**: 선택사항 (익명 지원)

### `GET /api/leaderboard`
- **쿼리**: `?range=weekly`
- **응답**: 상위 100명 주간 순위
- **캐시**: 60초

### `GET /api/og/attempt/[id]`
- **응답**: OpenGraph 공유 이미지
- **형식**: 1200x630 PNG

## 🧪 테스팅

```bash
# 모든 테스트 실행
pnpm test

# 감시 모드
pnpm test:watch

# 커버리지 리포트
pnpm test --coverage
```

테스트 커버리지 포함:
- 점수 알고리즘
- 속도 제한 로직
- React 컴포넌트 렌더링
- API 엔드포인트 검증

## 📦 배포

### Vercel (권장)

1. **저장소 연결**: GitHub 저장소를 Vercel에 연결
2. **환경 변수**: 모든 `.env.local` 변수를 Vercel에 추가
3. **배포**: main 브랜치 푸시 시 자동 배포

### 수동 배포

```bash
# 프로덕션 빌드
pnpm build

# 프로덕션 서버 시작
pnpm start
```

### 프로덕션용 환경 변수

Vercel 배포에 필요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_key
VERCEL_URL=your_vercel_domain
```

## 🗂️ 프로젝트 구조

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API 라우트 (Edge Runtime)
│   ├── (pages)/           # 페이지 컴포넌트
│   └── globals.css        # 글로벌 스타일
├── components/            # 재사용 가능한 React 컴포넌트
├── lib/                   # 유틸리티 및 설정
│   ├── i18n/             # 국제화
│   ├── supabase/         # 데이터베이스 클라이언트
│   ├── types/            # TypeScript 정의
│   └── utils/            # 헬퍼 함수
├── data/sample/          # 시드 데이터 파일
├── scripts/              # 데이터베이스 시딩 스크립트
├── supabase/migrations/  # 데이터베이스 스키마
└── __tests__/           # 테스트 파일
```

## 🎯 성능 최적화

- **엣지 런타임**: API 라우트가 Vercel Edge에서 실행
- **코드 분할**: 차트 라이브러리 지연 로딩
- **이미지 최적화**: Next.js 자동 최적화
- **캐싱 전략**: SWR로 적극적인 API 캐싱
- **번들 분석**: 최적화된 의존성

## 🤝 기여하기

1. 저장소 포크
2. 기능 브랜치 생성: `git checkout -b feature/amazing-feature`
3. 변경사항 커밋: `git commit -m 'Add amazing feature'`
4. 브랜치에 푸시: `git push origin feature/amazing-feature`
5. Pull Request 열기

### 개발 가이드라인

- TypeScript 엄격 사용 (`any` 타입 금지)
- 기존 코드 스타일과 패턴 따르기
- 새 기능에 테스트 추가
- API 변경 시 문서 업데이트
- 모바일 반응성 보장

## 📄 법적 면책조항

**교육 목적 전용**: 이 애플리케이션은 교육 및 오락 목적으로만 설계되었습니다. 금융 조언을 제공하지 않으며 실제 거래 결정에 사용해서는 안 됩니다.

전체 약관 및 면책조항은 `/legal` 페이지를 참조하세요.

## 📞 지원

문제 및 질문:
1. 기존 GitHub Issues 확인
2. 자세한 설명으로 새 이슈 생성
3. 환경 세부사항 및 재현 단계 포함

## 📈 로드맵

- [ ] 프로그레시브 웹 앱(PWA) 지원
- [ ] 디바이스 진동 피드백
- [ ] A/B 테스트 프레임워크
- [ ] 고급 분석 통합
- [ ] 더 많은 시간대 및 심볼
- [ ] 토너먼트 모드
- [ ] 소셜 공유 개선

---

**교육용 트레이딩 시뮬레이션을 위해 ❤️로 제작**