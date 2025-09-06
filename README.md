# 🚀 Errdaycoin - 차트 게임 & 트레이딩 시뮬레이터

실시간 차트를 보고 주가/암호화폐 방향을 예측하는 게임입니다. 다국어 지원과 AI 분석 기능을 포함한 완전한 트레이딩 시뮬레이터입니다.

## ✨ 주요 기능

- 🎯 **실시간 차트 게임** - 실제 시장 데이터로 만든 퀴즈
- 📈 **포트폴리오 관리** - 가상 투자 시뮬레이션
- 🤖 **AI 분석** - 기술적 분석 및 시장 인사이트
- 🌍 **다국어 지원** - 한국어, 영어, 일본어, 중국어, 스페인어, 프랑스어
- 👥 **커뮤니티** - 사용자 게시글 및 토론
- 📊 **리더보드** - 실시간 랭킹 시스템
- 📱 **반응형 디자인** - 모바일/데스크톱 완벽 지원

## 🛠 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Lightweight Charts
- **Deployment**: Vercel
- **Testing**: Jest

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/your-username/errdaycoin.git
cd errdaycoin
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 설정
```bash
# .env.local 파일 생성
cp .env.example .env.local
```

`.env.local` 파일에서 다음 값들을 설정하세요:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. 데이터베이스 설정
Supabase 프로젝트를 생성하고 다음 마이그레이션 파일들을 실행하세요:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_market_data_schema.sql`

### 5. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📦 배포

### Vercel 배포
1. [Vercel](https://vercel.com)에서 프로젝트 연결
2. 환경 변수 설정
3. 자동 배포 완료

자세한 배포 가이드는 [vercel-deploy.md](vercel-deploy.md)를 참고하세요.

## 📁 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── dashboard/         # 대시보드 페이지
│   ├── play/             # 게임 페이지
│   └── ...
├── components/            # React 컴포넌트
│   ├── charts/           # 차트 컴포넌트
│   ├── dashboard/        # 대시보드 컴포넌트
│   └── ...
├── lib/                  # 유틸리티 및 라이브러리
│   ├── supabase/        # Supabase 설정
│   ├── types/           # TypeScript 타입 정의
│   └── utils/           # 유틸리티 함수
├── supabase/            # 데이터베이스 마이그레이션
└── ...
```

## 🎮 게임 방법

1. **차트 분석**: 제시된 차트를 분석하세요
2. **방향 예측**: UP, DOWN, FLAT 중 선택
3. **점수 획득**: 정확한 예측으로 점수를 얻으세요
4. **리더보드**: 다른 플레이어와 순위를 경쟁하세요

## 🤝 기여하기

1. Fork 프로젝트
2. Feature 브랜치 생성 (`git checkout -b feature/AmazingFeature`)
3. 변경사항 커밋 (`git commit -m 'Add some AmazingFeature'`)
4. 브랜치에 Push (`git push origin feature/AmazingFeature`)
5. Pull Request 생성

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 있습니다.

## 📞 지원

- 이슈 리포트: [GitHub Issues](https://github.com/your-username/errdaycoin/issues)
- 이메일: support@errdaycoin.com

---

⭐ 이 프로젝트가 도움이 되었다면 스타를 눌러주세요!