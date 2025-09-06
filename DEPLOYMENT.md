# Errdaycoin - Vercel & Supabase 배포 가이드

## 1. Supabase 프로젝트 설정

### 1.1 Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에 접속하여 로그인
2. "New project" 클릭
3. 프로젝트 이름: `errdaycoin`
4. 데이터베이스 비밀번호 설정
5. 지역 선택: `Northeast Asia (Seoul)` 권장

### 1.2 데이터베이스 스키마 설정
1. Supabase 대시보드에서 SQL Editor로 이동
2. `supabase/migrations/001_initial_schema.sql` 파일의 내용을 복사하여 실행
3. `supabase/migrations/002_market_data_schema.sql` 파일의 내용을 복사하여 실행
4. `supabase/migrations/003_community_functions.sql` 파일의 내용을 복사하여 실행

### 1.3 환경 변수 확인
Supabase 대시보드의 Settings > API에서 다음 정보를 확인:
- Project URL
- anon public key
- service_role key (보안 주의)

## 2. Vercel 배포 설정

### 2.1 Vercel 프로젝트 생성
1. [Vercel](https://vercel.com)에 로그인
2. GitHub 저장소 연결
3. 프로젝트 이름: `errdaycoin`

### 2.2 환경 변수 설정
Vercel 대시보드의 Settings > Environment Variables에서 다음 변수들을 설정:

**Production & Preview 환경:**
```
NEXT_PUBLIC_SITE_NAME=Errdaycoin
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=en,ko,ja,zh,es,fr
NEXT_PUBLIC_SITE_URL=https://errdaycoin.vercel.app
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase anon key]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase service_role key]
```

**Development 환경:**
```
NEXT_PUBLIC_SITE_NAME=Errdaycoin (Dev)
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=en,ko,ja,zh,es,fr
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase anon key]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase service_role key]
```

### 2.3 도메인 설정 (선택사항)
1. Vercel 대시보드의 Settings > Domains
2. 커스텀 도메인 추가: `errdaycoin.com`
3. DNS 설정에서 CNAME 레코드 추가

## 3. 로컬 개발 환경 설정

### 3.1 환경 변수 파일 생성
프로젝트 루트에 `.env.local` 파일 생성:

```env
# Site Configuration
NEXT_PUBLIC_SITE_NAME="Errdaycoin"
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=en,ko,ja,zh,es,fr
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=[Your Supabase Project URL]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[Your Supabase anon key]
SUPABASE_SERVICE_ROLE_KEY=[Your Supabase service_role key]
```

### 3.2 의존성 설치 및 실행
```bash
npm install
npm run dev
```

## 4. 배포 확인 사항

### 4.1 빌드 테스트
```bash
npm run build
npm start
```

### 4.2 기능 테스트
- [ ] 홈페이지 로딩
- [ ] 다국어 전환
- [ ] 퀴즈 게임 플레이
- [ ] 리더보드 표시
- [ ] 사용자 인증 (익명)
- [ ] 데이터베이스 연결

### 4.3 성능 최적화
- [ ] Lighthouse 점수 확인
- [ ] 이미지 최적화
- [ ] 번들 크기 분석
- [ ] 캐싱 설정 확인

## 5. 모니터링 및 유지보수

### 5.1 Vercel Analytics
1. Vercel 대시보드에서 Analytics 활성화
2. 웹 바이탈 모니터링

### 5.2 Supabase 모니터링
1. Supabase 대시보드에서 사용량 확인
2. 데이터베이스 성능 모니터링
3. API 호출량 확인

### 5.3 에러 모니터링
- Vercel Functions 로그 확인
- Supabase 에러 로그 모니터링
- 브라우저 콘솔 에러 확인

## 6. 보안 고려사항

### 6.1 환경 변수 보안
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되지 않도록 주의
- 환경 변수는 Vercel 대시보드에서만 설정

### 6.2 Supabase RLS (Row Level Security)
- 데이터베이스 테이블에 적절한 RLS 정책 적용
- 사용자 권한 관리

### 6.3 CORS 설정
- Supabase에서 허용된 도메인만 API 접근 가능하도록 설정

## 7. 트러블슈팅

### 7.1 일반적인 문제들
- 환경 변수 누락: Vercel 대시보드에서 환경 변수 확인
- 빌드 실패: TypeScript/ESLint 에러 확인
- 데이터베이스 연결 실패: Supabase 환경 변수 확인

### 7.2 성능 문제
- 번들 크기가 큰 경우: webpack 설정 확인
- 느린 API 응답: Supabase 쿼리 최적화
- 이미지 로딩 지연: Next.js Image 컴포넌트 사용

## 8. 배포 체크리스트

배포 전 확인사항:
- [ ] 모든 환경 변수 설정 완료
- [ ] Supabase 데이터베이스 마이그레이션 완료
- [ ] 로컬 빌드 테스트 성공
- [ ] 기능 테스트 완료
- [ ] 성능 최적화 완료
- [ ] 보안 설정 확인
- [ ] 도메인 설정 완료 (해당하는 경우)

배포 완료 후:
- [ ] 프로덕션 환경에서 기능 테스트
- [ ] 성능 모니터링 설정
- [ ] 에러 모니터링 설정
- [ ] 백업 및 복구 계획 수립

