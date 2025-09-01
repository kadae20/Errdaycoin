'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const [error, setError] = useState<string>('')
  const [tableExists, setTableExists] = useState<boolean>(false)

  useEffect(() => {
    const testConnection = async () => {
      try {
        const supabase = createClient()
        
        // 환경 변수 확인
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        
        if (!supabaseUrl || !supabaseAnonKey || 
            supabaseUrl === 'your_supabase_project_url' || 
            supabaseAnonKey === 'your_supabase_anon_key') {
          throw new Error('Supabase 환경 변수가 설정되지 않았습니다')
        }

        // 데이터베이스 연결 테스트
        const { data, error } = await supabase
          .from('app_user')
          .select('count')
          .limit(1)

        if (error) {
          if (error.message.includes('relation "app_user" does not exist')) {
            setError('데이터베이스 테이블이 생성되지 않았습니다. 마이그레이션을 실행해주세요.')
            setTableExists(false)
          } else {
            throw error
          }
        } else {
          setTableExists(true)
        }

        setStatus('connected')
      } catch (err: any) {
        setStatus('error')
        setError(err.message || '알 수 없는 에러가 발생했습니다')
      }
    }

    testConnection()
  }, [])

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">🔌 Supabase 연결 테스트</h2>
      
      <div className="space-y-4">
        {/* 연결 상태 */}
        <div className="flex items-center gap-3">
          <span className="font-semibold">연결 상태:</span>
          {status === 'checking' && (
            <span className="text-blue-600">🔄 확인 중...</span>
          )}
          {status === 'connected' && (
            <span className="text-green-600">✅ 연결됨</span>
          )}
          {status === 'error' && (
            <span className="text-red-600">❌ 연결 실패</span>
          )}
        </div>

        {/* 환경 변수 확인 */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="font-semibold">SUPABASE_URL:</span>
            <span className={process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url' ? '✅ 설정됨' : '❌ 미설정'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold">SUPABASE_ANON_KEY:</span>
            <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' ? 'text-green-600' : 'text-red-600'}>
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key' ? '✅ 설정됨' : '❌ 미설정'}
            </span>
          </div>
        </div>

        {/* 테이블 존재 여부 */}
        <div className="flex items-center gap-3">
          <span className="font-semibold">데이터베이스 테이블:</span>
          <span className={tableExists ? 'text-green-600' : 'text-red-600'}>
            {tableExists ? '✅ 존재함' : '❌ 존재하지 않음'}
          </span>
        </div>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="font-semibold text-red-800 mb-2">에러 메시지:</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* 해결 방법 */}
        {status === 'error' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">해결 방법:</h3>
            <ol className="text-blue-700 space-y-1 list-decimal list-inside">
              <li>.env.local 파일에 실제 Supabase URL과 키를 입력하세요</li>
              <li>Supabase 프로젝트에서 마이그레이션을 실행하세요:
                <pre className="bg-gray-100 p-2 rounded mt-1 text-sm">
                  supabase/migrations/001_initial_schema.sql
                  supabase/migrations/002_market_data_schema.sql
                </pre>
              </li>
              <li>개발 서버를 재시작하세요: npm run dev</li>
            </ol>
          </div>
        )}

        {/* 성공 메시지 */}
        {status === 'connected' && tableExists && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🎉 완료!</h3>
            <p className="text-green-700">
              Supabase가 성공적으로 연결되었고 모든 테이블이 존재합니다. 
              이제 애플리케이션을 사용할 수 있습니다!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default SupabaseConnectionTest
