# 🚀 Vercel 환경변수 설정 가이드

## 1. Vercel 대시보드에서 환경변수 설정

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard 방문
   - `errdaycoin` 프로젝트 선택

2. **Settings → Environment Variables**
   - Settings 탭 클릭
   - Environment Variables 메뉴 선택

3. **환경변수 추가** (모든 환경에 추가: Production, Preview, Development)

### 필수 환경변수:

```
NEXT_PUBLIC_SITE_NAME=Errdaycoin
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=en,ko,ja,zh,es,fr
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app

# Supabase (API 키 입력 필요)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 2. 환경변수 설정 후 재배포

환경변수 설정 완료 후:
1. Vercel 대시보드에서 "Redeploy" 클릭
2. 또는 터미널에서: `vercel --prod`

## 3. 배포 완료 확인

배포 완료 후 확인사항:
- ✅ 홈페이지 로딩
- ✅ 퀴즈 게임 작동
- ✅ 다국어 전환
- ✅ 데이터베이스 연결

## 📝 Supabase 설정 필요시

아직 Supabase 프로젝트가 없다면:

1. **Supabase 프로젝트 생성**
   - https://supabase.com → 새 프로젝트
   - 프로젝트명: `errdaycoin`

2. **데이터베이스 스키마 설정**
   - SQL Editor에서 실행:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_market_data_schema.sql`

3. **API 키 확인**
   - Settings → API
   - URL과 anon key, service_role key 복사

## 🎯 현재 상태

- ✅ 코드 준비 완료
- ✅ 빌드 성공
- ⏳ 환경변수 설정 필요
- ⏳ 재배포 필요

환경변수 설정 후 바로 서비스 시작 가능합니다!
