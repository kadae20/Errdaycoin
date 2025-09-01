import SupabaseConnectionTest from '@/components/test/SupabaseConnectionTest'

export const metadata = {
  title: 'Supabase 연결 테스트 - Errdaycoin',
  description: 'Supabase 데이터베이스 연결 상태를 확인합니다',
}

export default function TestSupabasePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <SupabaseConnectionTest />
      </div>
    </div>
  )
}
