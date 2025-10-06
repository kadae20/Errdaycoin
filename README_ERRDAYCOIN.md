# ErrdayCoin - 선물거래 시뮬레이터

실제 바이낸스 차트 데이터를 사용한 선물거래 시뮬레이터 게임입니다.

## 🎯 주요 기능

### 🎮 게임 기능
- **실제 차트 데이터**: 바이낸스 API를 통한 과거 일봉 데이터 사용
- **레버리지 거래**: 1~100배 레버리지 선택 가능
- **포지션 관리**: Long/Short 포지션, 청산가 자동 계산
- **PNL 계산**: 실제 선물거래 공식 적용
- **Next Day 시스템**: 단계별 차트 공개

### 👥 사용자 시스템
- **Google OAuth**: 간편 로그인
- **프로필 관리**: 닉네임, 아바타, 언어 설정
- **토큰 이코노미**: retry_tokens로 게임 재시작
- **추천인 시스템**: 친구 초대 시 양쪽 모두 토큰 보상

### 💰 토큰 시스템
- **Retry Tokens**: 게임 재시작용 (기본 10개)
- **Next Day Uses**: 게임당 15회 제한
- **토큰 획득**: 추천인 가입, 출석, 이벤트 참여
- **토큰 소모**: 게임 재시작, Next Day 추가 사용

### 🔗 마케팅 기능
- **Bitget 레퍼럴**: 상단/플로팅 배너로 추천 링크 노출
- **클릭 추적**: 배너 클릭 데이터 수집 및 분석
- **추천인 보상**: 월별 추천 실적에 따른 보너스 토큰

### 👨‍💼 관리자 기능
- **대시보드**: 사용자, 게임, 토큰 통계
- **CSV 업로드**: 토큰 일괄 지급
- **클릭 로그**: 배너 클릭 추적 데이터
- **월별 보상**: 추천인 보너스 자동 지급

## 🛠 기술 스택

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **API**: Binance Public API (차트 데이터)
- **Deploy**: Vercel

## 📁 프로젝트 구조

```
├── app/                      # Next.js App Router
│   ├── api/                 # API Routes
│   │   ├── game/           # 게임 관련 API
│   │   ├── referral/       # 추천인 관련 API
│   │   ├── tokens/         # 토큰 관련 API
│   │   └── chart/          # 차트 데이터 API
│   ├── admin/              # 관리자 페이지
│   ├── play/               # 메인 게임 페이지
│   └── page.tsx            # 홈페이지
├── components/              # React 컴포넌트
│   ├── ErrdayCoinGame.tsx  # 메인 게임 컴포넌트
│   ├── BitgetBanner.tsx    # Bitget 배너들
│   └── ...
├── lib/                    # 유틸리티 및 서비스
│   ├── services/           # 비즈니스 로직
│   │   ├── game-service.ts
│   │   ├── referral-service.ts
│   │   └── binance-api.ts
│   ├── types/              # TypeScript 타입
│   └── supabase/           # Supabase 설정
└── supabase/
    └── migrations/         # DB 마이그레이션
```

## 🚀 설치 및 실행

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Bitget 레퍼럴 코드
NEXT_PUBLIC_BITGET_REF_CODE=ErrdayCoin2024
```

### 2. 데이터베이스 마이그레이션

```bash
# Supabase CLI 설치 (필요한 경우)
npm install -g supabase

# 프로젝트 링크
supabase link --project-ref your_project_ref

# 마이그레이션 실행
supabase db push
```

### 3. 프로젝트 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

## 🎮 게임 플레이 방법

1. **회원가입**: Google 계정으로 간편 로그인
2. **게임 시작**: 랜덤한 암호화폐의 과거 차트 제공
3. **포지션 설정**:
   - Long/Short 선택
   - 레버리지 1~100배 설정
   - 포지션 비중 1~100% 선택
4. **거래 진행**: Next Day 버튼으로 다음 캔들 공개
5. **결과 확인**: PNL, ROI, 청산 여부 확인
6. **게임 종료**: 포지션 종료 또는 청산 시 게임 완료

## 💡 핵심 공식

### 청산가 계산
```typescript
// Long 포지션
liquidationPrice = entryPrice * (1 - (1 / leverage))

// Short 포지션  
liquidationPrice = entryPrice * (1 + (1 / leverage))
```

### PNL 계산
```typescript
// Long 포지션
PNL = (exitPrice - entryPrice) * positionSize * leverage

// Short 포지션
PNL = (entryPrice - exitPrice) * positionSize * leverage
```

### ROI 계산
```typescript
ROI = (PNL / positionSize) * 100
```

## 🔧 관리자 기능

### CSV 토큰 지급
CSV 파일 형식:
```csv
user_id,amount,reason
uuid-1,100,event_reward
uuid-2,50,referral_bonus
```

### 월별 보상 처리
- 5명 이상 추천 시 추가 토큰 지급
- 추천 실적에 따른 차등 보상

## 📊 데이터베이스 스키마

주요 테이블:
- `profiles`: 사용자 프로필
- `user_tokens`: 토큰 잔액
- `token_logs`: 토큰 거래 내역
- `referral_codes`: 추천 코드
- `referrals`: 추천 관계
- `game_sessions`: 게임 세션
- `clicks`: 배너 클릭 추적

## 🎯 향후 계획

- [ ] 모바일 앱 (React Native)
- [ ] 실시간 리더보드
- [ ] 소셜 기능 (친구 대전)
- [ ] NFT 보상 시스템
- [ ] 추가 거래소 연동

## 📄 라이선스

MIT License

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

**ErrdayCoin** - 실전 같은 선물거래 시뮬레이터로 안전하게 거래 기술을 연마하세요! 🚀
