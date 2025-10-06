# ErrdayCoin 배포 가이드

이 문서는 ErrdayCoin 선물거래 시뮬레이터를 프로덕션 환경에 배포하는 방법을 설명합니다.

## 📋 배포 전 체크리스트

- [ ] Supabase 프로젝트 생성 완료
- [ ] Google OAuth 앱 설정 완료 (선택사항)
- [ ] Bitget 레퍼럴 코드 준비
- [ ] 도메인 준비 (선택사항)

## 🛠 1. Supabase 설정

### 1.1 새 프로젝트 생성
1. [Supabase Dashboard](https://supabase.com/dashboard)에서 새 프로젝트 생성
2. 프로젝트 이름: `errdaycoin`
3. 데이터베이스 비밀번호 설정 후 생성

### 1.2 환경 변수 확인
프로젝트 설정에서 다음 정보 확인:
- `NEXT_PUBLIC_SUPABASE_URL`: Project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Project API Keys > anon public
- `SUPABASE_SERVICE_ROLE_KEY`: Project API Keys > service_role (보안 주의!)

### 1.3 데이터베이스 마이그레이션
```bash
# 로컬에서 Supabase CLI로 마이그레이션 실행
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

### 1.4 RLS (Row Level Security) 확인
마이그레이션 후 Supabase Dashboard에서 다음 확인:
- 모든 테이블에 RLS 활성화 여부
- 정책(Policies)이 올바르게 생성되었는지 확인

## 🔐 2. Google OAuth 설정 (선택사항)

### 2.1 Google Cloud Console
1. [Google Cloud Console](https://console.cloud.google.com/)에서 새 프로젝트 생성
2. APIs & Services > OAuth consent screen 설정
3. Credentials > OAuth 2.0 Client IDs 생성

### 2.2 Redirect URLs 설정
```
https://your-project-ref.supabase.co/auth/v1/callback
https://yourdomain.com/auth/callback (프로덕션 도메인)
```

### 2.3 Supabase Auth 설정
Supabase Dashboard > Authentication > Providers > Google:
- Enable Google provider
- Client ID, Client Secret 입력

## 🚀 3. Vercel 배포

### 3.1 GitHub 연동
1. GitHub에 코드 푸시
2. [Vercel Dashboard](https://vercel.com/dashboard)에서 Import Project
3. GitHub 리포지토리 선택

### 3.2 환경 변수 설정
Vercel Project Settings > Environment Variables에 다음 추가:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Site Configuration
NEXT_PUBLIC_SITE_NAME=ErrdayCoin
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Google OAuth (선택사항)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Bitget Referral
NEXT_PUBLIC_BITGET_REF_CODE=ErrdayCoin2024

# Analytics (선택사항)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 3.3 도메인 설정 (선택사항)
1. Vercel Project Settings > Domains
2. 커스텀 도메인 추가
3. DNS 설정 (CNAME 레코드)

## 🔧 4. 배포 후 확인사항

### 4.1 기본 기능 테스트
- [ ] 홈페이지 로딩 확인
- [ ] 회원가입/로그인 테스트
- [ ] 게임 시작 및 플레이 테스트
- [ ] 추천인 코드 기능 테스트

### 4.2 관리자 계정 설정
```sql
-- Supabase SQL Editor에서 실행
UPDATE profiles 
SET role = 'admin' 
WHERE id = 'your-user-uuid';
```

### 4.3 Bitget 배너 테스트
- [ ] 배너 표시 확인
- [ ] 클릭 추적 동작 확인
- [ ] 레퍼럴 링크 정상 작동 확인

## 📊 5. 모니터링 설정

### 5.1 Supabase 모니터링
- Database Usage 확인
- API Requests 모니터링
- Error Logs 확인

### 5.2 Vercel 모니터링
- Function Logs 확인
- Performance Insights 활용
- Error Tracking 설정

### 5.3 Google Analytics (선택사항)
- GA4 프로퍼티 생성
- 측정 ID 환경변수에 추가
- 이벤트 추적 확인

## 🔄 6. 지속적 배포 (CI/CD)

### 6.1 자동 배포 설정
Vercel은 GitHub 푸시 시 자동 배포됩니다:
- `main` 브랜치 → 프로덕션 배포
- 다른 브랜치 → 프리뷰 배포

### 6.2 데이터베이스 마이그레이션
새로운 마이그레이션이 있을 때:
```bash
# 로컬에서 실행
supabase db push
```

## 🚨 7. 보안 고려사항

### 7.1 환경 변수 보안
- `SERVICE_ROLE_KEY`는 절대 클라이언트에 노출되지 않도록 주의
- 프로덕션 환경에서만 사용되는 키는 별도 관리

### 7.2 RLS 정책 검증
- 사용자가 다른 사용자의 데이터에 접근할 수 없는지 확인
- 관리자 권한이 올바르게 제한되는지 확인

### 7.3 Rate Limiting
- API 엔드포인트에 적절한 속도 제한 적용
- Supabase 프로젝트의 사용량 모니터링

## 📈 8. 성능 최적화

### 8.1 이미지 최적화
- Next.js Image 컴포넌트 사용
- WebP 형식 지원

### 8.2 데이터베이스 최적화
- 인덱스 확인 및 추가
- 쿼리 성능 모니터링

### 8.3 캐싱 전략
- API 응답 캐싱
- 정적 자산 CDN 활용

## 🆘 9. 트러블슈팅

### 9.1 일반적인 문제들

**문제**: 로그인이 안됨
```
해결: 
1. Supabase Auth 설정 확인
2. Redirect URL 설정 확인
3. 환경변수 확인
```

**문제**: 게임 데이터가 로딩되지 않음
```
해결:
1. Binance API 응답 확인
2. 네트워크 연결 상태 확인
3. CORS 설정 확인
```

**문제**: 추천인 코드가 작동하지 않음
```
해결:
1. URL 파라미터 파싱 확인
2. 데이터베이스 RLS 정책 확인
3. 코드 유효성 검사 로직 확인
```

### 9.2 로그 확인 방법
- Vercel Functions 로그: Vercel Dashboard > Functions
- Supabase 로그: Supabase Dashboard > Logs
- 브라우저 콘솔: 개발자 도구

## 📞 10. 지원 및 문의

배포 과정에서 문제가 발생하면:
1. 이 문서의 트러블슈팅 섹션 확인
2. GitHub Issues에 문제 보고
3. Supabase/Vercel 공식 문서 참조

---

**성공적인 배포를 위해 각 단계를 차근차근 따라해주세요!** 🚀
