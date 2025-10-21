import { NextRequest, NextResponse } from 'next/server'

// 최소 미들웨어: 모든 요청을 통과시키되, 정적 자원/파비콘/_next는 매칭에서 제외
export function middleware(_req: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|api|.*\\..*|favicon.ico).*)'],
}