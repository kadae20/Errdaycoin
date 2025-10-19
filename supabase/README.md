# ErrdayCoin Supabase 설정 가이드

## 🚀 데이터베이스 설정 방법

### 1. Supabase 프로젝트 생성
1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. "New Project" 클릭
3. 프로젝트 이름: `errdaycoin`
4. 데이터베이스 비밀번호 설정
5. 지역 선택 (가장 가까운 지역)

### 2. 데이터베이스 스키마 적용
1. Supabase 대시보드에서 프로젝트 선택
2. 왼쪽 메뉴에서 "SQL Editor" 클릭
3. "New Query" 클릭
4. `complete_schema.sql` 파일의 내용을 복사해서 붙여넣기
5. "Run" 버튼 클릭하여 실행

### 3. 환경 변수 설정
프로젝트 루트의 `.env.local` 파일에 다음 값들을 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 4. Supabase URL 및 키 찾기
1. Supabase 대시보드에서 프로젝트 선택
2. 왼쪽 메뉴에서 "Settings" → "API" 클릭
3. 다음 값들을 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role**: `SUPABASE_SERVICE_ROLE_KEY`

## 📊 생성되는 테이블들

### 주요 테이블
- `user_tokens`: 사용자 토큰 및 잔액 관리
- `game_sessions`: 게임 세션 데이터
- `positions`: 포지션 정보
- `token_logs`: 토큰 변동 로그

### 추천 시스템 테이블
- `user_referral_codes`: 사용자별 추천코드
- `referral_relationships`: 추천 관계
- `referral_rewards`: 추천 보상 로그

## 🔧 주요 기능

### 1. 자동 사용자 생성
- Google 로그인 시 자동으로 `user_tokens` 레코드 생성
- 기본값: 15 retry tokens, 1000 USDT 잔액

### 2. 추천 시스템
- 8자리 영숫자 추천코드 자동 생성
- 추천인과 피추천인 모두 +3 토큰 보상
- 추천 통계 및 로그 관리

### 3. RLS (Row Level Security)
- 모든 테이블에 RLS 적용
- 사용자는 자신의 데이터만 접근 가능
- 서비스 계정은 모든 데이터 접근 가능

## 🚨 주의사항

1. **데이터베이스 비밀번호**: 안전한 비밀번호 사용
2. **환경 변수**: `.env.local` 파일을 `.gitignore`에 추가
3. **서비스 키**: `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요
4. **백업**: 정기적으로 데이터베이스 백업 권장

## 🔍 문제 해결

### RLS 에러가 발생하는 경우
- `complete_schema.sql`을 다시 실행
- RLS 정책이 올바르게 적용되었는지 확인

### 토큰이 차감되지 않는 경우
- `token_logs` 테이블의 RLS 정책 확인
- 서비스 계정 권한 확인

### 추천코드가 생성되지 않는 경우
- `create_unique_referral_code` 함수 확인
- `user_referral_codes` 테이블 권한 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. Supabase 대시보드의 로그 확인
2. 브라우저 개발자 도구의 콘솔 확인
3. 환경 변수가 올바르게 설정되었는지 확인
