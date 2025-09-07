import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // API 라우트는 미들웨어에서 제외
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }
  
  // 정적 파일들도 제외
  if (request.nextUrl.pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)) {
    return NextResponse.next()
  }
  
  // 개발 모드에서는 인증 체크 생략
  if (process.env.NODE_ENV === 'development') {
    return NextResponse.next()
  }
  
  // 프로덕션에서도 일단 통과 (Supabase 설정 없이)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 경로에서 미들웨어 실행:
     * - _next/static (static files)  
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}