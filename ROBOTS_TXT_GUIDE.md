# ErrdayCoin Robots.txt 설정 가이드

## 📋 현재 robots.txt 설정

### 1. 파일 위치
- **정적 파일**: `/public/robots.txt` (우선순위 높음)
- **동적 생성**: `/app/robots.ts` (Next.js 자동 생성)

### 2. 허용된 페이지 (SEO 최적화)
```
✅ / (홈페이지)
✅ /play (게임 페이지)
✅ /leaderboard (리더보드)
✅ /community (커뮤니티)
✅ /analysis (분석)
✅ /legal (이용약관)
```

### 3. 차단된 페이지 (보안 및 개인정보)
```
❌ /api/ (API 엔드포인트)
❌ /admin/ (관리자 페이지)
❌ /private/ (개인정보)
❌ /test-db/ (테스트 데이터베이스)
❌ /auth/ (인증 관련)
❌ /result/ (개인 결과)
❌ /dashboard/ (개인 대시보드)
❌ /portfolio/ (개인 포트폴리오)
❌ /watchlist/ (개인 관심목록)
❌ /_next/ (Next.js 내부 파일)
❌ /_vercel/ (Vercel 내부 파일)
❌ /node_modules/ (의존성 파일)
```

## 🎯 암호화폐 트레이딩 시뮬레이터 최적화

### 1. SEO 친화적 페이지만 허용
- **공개 콘텐츠**: 게임, 리더보드, 커뮤니티
- **교육 콘텐츠**: 분석, 가이드, 튜토리얼
- **법적 페이지**: 이용약관, 개인정보처리방침

### 2. 개인정보 보호
- **사용자 데이터**: 대시보드, 포트폴리오, 관심목록 차단
- **API 엔드포인트**: 모든 API 경로 차단
- **인증 관련**: 로그인, 회원가입 페이지 차단

### 3. 크롤러 최적화
- **Googlebot**: 크롤링 지연 없음 (0초)
- **일반 크롤러**: 1초 지연
- **중국/러시아 크롤러**: 2초 지연

## 🔍 검색 엔진별 설정

### Google (Googlebot)
```
User-agent: Googlebot
Allow: / (모든 공개 페이지)
Crawl-delay: 0 (빠른 크롤링)
```

### Bing (Bingbot)
```
User-agent: Bingbot
Allow: / (모든 공개 페이지)
Crawl-delay: 1 (1초 지연)
```

### 네이버 (Yeti)
```
User-agent: Yeti
Allow: / (모든 공개 페이지)
Crawl-delay: 1 (1초 지연)
```

### 기타 검색 엔진
- **DuckDuckGo**: DuckDuckBot
- **Yahoo**: Slurp
- **Baidu**: Baiduspider
- **Yandex**: YandexBot

## 📊 SEO 성과 측정

### 1. Google Search Console
- robots.txt 파일 검증
- 크롤링 오류 모니터링
- 색인 상태 확인

### 2. 주요 지표
- **색인된 페이지 수**: 목표 10+ 페이지
- **크롤링 오류**: 0개 유지
- **검색 노출**: 주요 키워드 상위 20위

### 3. 모니터링 키워드
- "crypto trading simulator"
- "bitcoin trading game"
- "ethereum futures practice"
- "crypto chart quiz"
- "leverage trading simulator"

## 🚀 추가 최적화 권장사항

### 1. 사이트맵 최적화
- XML 사이트맵 자동 생성
- 우선순위 설정 (홈페이지: 1.0, 게임: 0.9)
- 업데이트 빈도 설정

### 2. 메타데이터 강화
- 페이지별 고유 제목/설명
- Open Graph 태그
- Twitter Cards
- 구조화된 데이터 (Schema.org)

### 3. 콘텐츠 최적화
- 키워드 밀도 최적화
- 내부 링크 구조
- 이미지 alt 텍스트
- 모바일 최적화

## ⚠️ 주의사항

### 1. 보안
- 개인정보가 포함된 페이지는 반드시 차단
- API 엔드포인트는 모두 차단
- 관리자 페이지는 차단

### 2. 성능
- 크롤링 지연 시간 적절히 설정
- 불필요한 리소스 차단
- 서버 부하 최소화

### 3. 업데이트
- 새로운 페이지 추가 시 robots.txt 업데이트
- 정기적인 검증 및 모니터링
- 검색 엔진 정책 변경 대응

## 📈 예상 효과

### 단기 (1-3개월)
- 검색 엔진 색인 완료
- 크롤링 오류 제거
- 기본 SEO 점수 향상

### 중기 (3-6개월)
- 주요 키워드 상위 노출
- 유기적 트래픽 증가
- 브랜드 인지도 향상

### 장기 (6-12개월)
- 검색 순위 안정화
- 고품질 백링크 확보
- 사용자 참여도 향상
