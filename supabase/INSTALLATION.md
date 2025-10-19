# 🚀 Supabase 데이터베이스 설치 가이드

## ⚠️ 중요 사항

이 스크립트는 **기존 테이블을 모두 삭제**하고 새로 생성합니다!
- 기존 데이터가 있다면 **모두 삭제**됩니다
- 프로덕션 환경에서는 신중하게 실행하세요
- 백업을 먼저 만드는 것을 권장합니다

## 📝 설치 단계

### 1단계: Supabase 프로젝트 준비
1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트를 선택하거나 새로 생성

### 2단계: SQL 실행
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. **"New Query"** 버튼 클릭
3. `complete_schema.sql` 파일의 **전체 내용**을 복사
4. SQL Editor에 붙여넣기
5. **"Run"** 버튼 클릭 (또는 `Ctrl/Cmd + Enter`)

### 3단계: 실행 확인
실행이 성공하면 다음과 같은 메시지가 표시됩니다:
```
ErrdayCoin database schema has been successfully created!
```

### 4단계: 테이블 확인
1. 왼쪽 메뉴에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `user_tokens`
   - ✅ `game_sessions`
   - ✅ `positions`
   - ✅ `token_logs`
   - ✅ `user_referral_codes`
   - ✅ `referral_relationships`
   - ✅ `referral_rewards`

## 🔑 환경 변수 설정

### 1. Supabase 키 가져오기
1. Supabase Dashboard에서 프로젝트 선택
2. **Settings** → **API** 클릭
3. 다음 값들을 복사:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 2. .env.local 파일 생성
프로젝트 루트에 `.env.local` 파일을 만들고 다음 내용 추가:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 🧪 테스트

### 데이터베이스 연결 테스트
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속 후:
1. Google 로그인 시도
2. 콘솔에서 에러 확인
3. 게임 플레이 테스트

## 📊 생성된 구조

### 테이블
| 테이블 | 설명 | 주요 컬럼 |
|--------|------|----------|
| `user_tokens` | 사용자 토큰/잔액 | `retry_tokens`, `balance` |
| `game_sessions` | 게임 세션 | `session_data` (JSONB) |
| `positions` | 포지션 정보 | `side`, `leverage`, `entry_price` |
| `token_logs` | 토큰 변동 로그 | `delta`, `reason` |
| `user_referral_codes` | 추천코드 | `referral_code` (8자리) |
| `referral_relationships` | 추천 관계 | `referrer_id`, `referee_id` |
| `referral_rewards` | 추천 보상 | `referrer_tokens`, `referee_tokens` |

### 함수
- `generate_referral_code()`: 8자리 랜덤 코드 생성
- `create_unique_referral_code(user_id)`: 중복 없는 추천코드 생성
- `process_referral_reward(referrer_id, referee_id, code)`: 추천 보상 처리

### RLS 정책
- 모든 테이블에 Row Level Security 적용
- 사용자는 자신의 데이터만 접근 가능
- 서비스 계정은 모든 데이터 접근 가능

## 🐛 문제 해결

### 에러: "foreign key constraint cannot be implemented"
- **원인**: 기존 테이블의 타입 불일치
- **해결**: 스크립트가 기존 테이블을 먼저 삭제하므로 해결됨

### 에러: "permission denied"
- **원인**: RLS 정책 문제
- **해결**: 스크립트를 다시 실행하여 RLS 정책 재적용

### 에러: "function already exists"
- **원인**: 함수가 이미 존재
- **해결**: 문제 없음 (OR REPLACE 사용)

### 데이터가 보이지 않음
1. RLS 정책 확인:
   - Table Editor에서 테이블 선택
   - RLS가 활성화되어 있는지 확인
2. 로그인 상태 확인:
   - 인증된 사용자만 데이터 접근 가능

## 🔒 보안 권장사항

1. **서비스 키 보호**
   - `SUPABASE_SERVICE_ROLE_KEY`는 절대 공개하지 마세요
   - `.env.local` 파일을 `.gitignore`에 추가

2. **RLS 정책 검증**
   - 각 테이블의 RLS가 올바르게 작동하는지 테스트
   - 다른 사용자의 데이터에 접근할 수 없는지 확인

3. **정기 백업**
   - Supabase Dashboard에서 정기 백업 설정
   - 중요 데이터는 별도 저장

## 💡 다음 단계

1. ✅ 데이터베이스 설정 완료
2. ✅ 환경 변수 설정 완료
3. 🚀 애플리케이션 실행 및 테스트
4. 📱 Google 로그인 테스트
5. 🎮 게임 플레이 테스트
6. 🔗 추천 시스템 테스트
