import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // 개발 모드에서는 모든 요청을 통과시킴
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * API 라우트와 정적 파일을 제외한 모든 경로
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}