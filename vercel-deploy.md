# Errdaycoin Vercel 배포 가이드

## 1. 빠른 배포 단계

### Step 1: Supabase 프로젝트 생성
1. [Supabase](https://supabase.com)에서 새 프로젝트 생성
2. Project name: `errdaycoin`
3. Region: `Northeast Asia (Seoul)` 선택
4. 데이터베이스 비밀번호 설정

### Step 2: 데이터베이스 스키마 설정
Supabase 대시보드 > SQL Editor에서 다음 파일들을 순서대로 실행:

1. `supabase/migrations/001_initial_schema.sql` 내용 복사 후 실행
2. `supabase/migrations/002_market_data_schema.sql` 내용 복사 후 실행

### Step 3: Vercel 배포
1. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
2. 프로젝트 이름: `errdaycoin`
3. Framework Preset: `Next.js` 자동 감지
4. Root Directory: `./` (기본값)

### Step 4: 환경변수 설정
Vercel 대시보드 > Settings > Environment Variables에서 다음 변수들을 **모든 환경(Production, Preview, Development)**에 추가:

```env
NEXT_PUBLIC_SITE_NAME=Errdaycoin
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=en,ko,ja,zh,es,fr
NEXT_PUBLIC_SITE_URL=https://your-vercel-domain.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**중요**: 
- `NEXT_PUBLIC_SUPABASE_URL`과 키들은 Supabase 대시보드 > Settings > API에서 확인
- `NEXT_PUBLIC_SITE_URL`은 배포 후 실제 Vercel 도메인으로 업데이트

### Step 5: 배포 실행
1. Vercel에서 "Deploy" 클릭
2. 배포 완료 후 도메인 확인
3. 환경변수에서 `NEXT_PUBLIC_SITE_URL`을 실제 도메인으로 업데이트
4. 다시 배포 (Redeploy)

## 2. 배포 후 확인사항

✅ 홈페이지 로딩
✅ 퀴즈 게임 플레이 가능
✅ 리더보드 표시
✅ 다국어 전환
✅ 데이터베이스 연결 확인

## 3. 커스텀 도메인 (선택사항)

1. Vercel 대시보드 > Settings > Domains
2. 도메인 추가 (예: errdaycoin.com)
3. DNS 설정에서 CNAME 레코드 추가
4. 환경변수 `NEXT_PUBLIC_SITE_URL` 업데이트

## 트러블슈팅

**빌드 실패 시:**
- TypeScript 에러 확인
- 환경변수 누락 확인
- Next.js 버전 호환성 확인

**데이터베이스 연결 실패 시:**
- Supabase URL과 키 재확인
- RLS 정책 확인
- 네트워크 연결 확인

**성능 최적화:**
- 이미지 최적화 확인
- 번들 크기 분석
- 캐싱 설정 검토
