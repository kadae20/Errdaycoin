'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { createClient } from '@/lib/supabase/client'
import { referralService } from '@/lib/services/referral-service'

interface AdminStats {
  totalUsers: number
  totalReferrals: number
  totalTokensIssued: number
  totalGames: number
  totalClicks: number
  activeUsersToday: number
}

interface ClickData {
  click_id: string
  exchange: string
  ref_code: string
  banner_slot: string
  created_at: string
  user_id?: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [clicks, setClicks] = useState<ClickData[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploadResult, setUploadResult] = useState<string>('')

  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  const checkAdminAccess = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        setLoading(false)
        return
      }

      if (profile?.role === 'admin') {
        setIsAdmin(true)
        loadAdminData()
      }
    } catch (error) {
      console.error('Admin check error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      // 통계 데이터 로드
      const [
        usersResult,
        referralsResult,
        tokensResult,
        gamesResult,
        clicksResult,
        activeUsersResult
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('referrals').select('id', { count: 'exact' }),
        supabase.from('token_logs').select('delta').eq('kind', 'earn'),
        supabase.from('game_sessions').select('id', { count: 'exact' }),
        supabase.from('clicks').select('id', { count: 'exact' }),
        supabase
          .from('game_sessions')
          .select('user_id', { count: 'exact' })
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      ])

      const totalTokensIssued = tokensResult.data?.reduce((sum, log) => sum + log.delta, 0) || 0

      setStats({
        totalUsers: usersResult.count || 0,
        totalReferrals: referralsResult.count || 0,
        totalTokensIssued,
        totalGames: gamesResult.count || 0,
        totalClicks: clicksResult.count || 0,
        activeUsersToday: activeUsersResult.count || 0
      })

      // 최근 클릭 데이터 로드
      const { data: recentClicks } = await supabase
        .from('clicks')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      setClicks(recentClicks || [])

    } catch (error) {
      console.error('Admin data load error:', error)
    }
  }

  const handleCsvUpload = async () => {
    if (!csvFile) return

    try {
      setUploadResult('업로드 중...')
      
      // CSV 파일 읽기
      const text = await csvFile.text()
      const lines = text.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        setUploadResult('CSV 파일이 비어있거나 형식이 잘못되었습니다.')
        return
      }

      // 헤더 확인
      const headers = lines[0].split(',').map(h => h.trim())
      const expectedHeaders = ['user_id', 'amount', 'reason']
      
      if (!expectedHeaders.every(header => headers.includes(header))) {
        setUploadResult(`CSV 헤더가 잘못되었습니다. 필요한 헤더: ${expectedHeaders.join(', ')}`)
        return
      }

      let successCount = 0
      let errorCount = 0

      // 각 행 처리
      for (let i = 1; i < lines.length; i++) {
        try {
          const values = lines[i].split(',').map(v => v.trim())
          const rowData: Record<string, string> = {}
          
          headers.forEach((header, index) => {
            rowData[header] = values[index] || ''
          })

          const { user_id, amount, reason } = rowData
          
          if (!user_id || !amount || !reason) {
            errorCount++
            continue
          }

          const tokenAmount = parseInt(amount)
          if (isNaN(tokenAmount) || tokenAmount <= 0) {
            errorCount++
            continue
          }

          // 토큰 지급 API 호출
          const response = await fetch('/api/tokens', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              userId: user_id,
              amount: tokenAmount,
              reason: `admin_csv_${reason}`,
              meta: { csv_upload: true, admin_id: user?.id }
            })
          })

          if (response.ok) {
            successCount++
          } else {
            errorCount++
          }

        } catch (error) {
          console.error(`Row ${i} processing error:`, error)
          errorCount++
        }
      }

      setUploadResult(`업로드 완료: 성공 ${successCount}건, 실패 ${errorCount}건`)
      
      // 데이터 새로고침
      loadAdminData()

    } catch (error) {
      console.error('CSV upload error:', error)
      setUploadResult('업로드 중 오류가 발생했습니다: ' + (error as Error).message)
    }
  }

  const processMonthlyRewards = async () => {
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      await referralService.processMonthlyRewards(year, month)
      
      alert('월별 보상 처리가 완료되었습니다.')
      loadAdminData()
    } catch (error) {
      console.error('Monthly rewards error:', error)
      alert('월별 보상 처리 중 오류가 발생했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-yellow-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>권한을 확인하는 중...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold mb-4">접근 권한이 없습니다</h2>
          <p className="text-gray-400">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-yellow-400 mb-2">ErrdayCoin 관리자 콘솔</h1>
          <p className="text-gray-400">시스템 관리 및 통계</p>
        </div>

        {/* 통계 카드 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">총 사용자</h3>
              <div className="text-3xl font-bold text-blue-400">{stats.totalUsers.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">총 추천</h3>
              <div className="text-3xl font-bold text-green-400">{stats.totalReferrals.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">발행된 토큰</h3>
              <div className="text-3xl font-bold text-yellow-400">{stats.totalTokensIssued.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">총 게임 수</h3>
              <div className="text-3xl font-bold text-purple-400">{stats.totalGames.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">배너 클릭</h3>
              <div className="text-3xl font-bold text-orange-400">{stats.totalClicks.toLocaleString()}</div>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">오늘 활성 사용자</h3>
              <div className="text-3xl font-bold text-red-400">{stats.activeUsersToday.toLocaleString()}</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CSV 업로드 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">토큰 일괄 지급 (CSV)</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  CSV 파일 (user_id, amount, reason)
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                  className="w-full p-2 bg-gray-700 rounded border border-gray-600"
                />
              </div>
              
              <button
                onClick={handleCsvUpload}
                disabled={!csvFile}
                className="w-full py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-black font-semibold rounded"
              >
                업로드 및 처리
              </button>
              
              {uploadResult && (
                <div className="p-3 bg-gray-700 rounded text-sm">
                  {uploadResult}
                </div>
              )}
            </div>
          </div>

          {/* 월별 보상 처리 */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">월별 추천 보상</h2>
            <div className="space-y-4">
              <p className="text-sm text-gray-400">
                이번 달 추천 실적에 따른 보너스 토큰을 지급합니다.
                (5명 이상 추천 시 추가 보상)
              </p>
              
              <button
                onClick={processMonthlyRewards}
                className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded"
              >
                이번 달 보상 처리
              </button>
            </div>
          </div>
        </div>

        {/* 최근 클릭 로그 */}
        <div className="mt-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">최근 배너 클릭 (50개)</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-2">시간</th>
                    <th className="text-left p-2">거래소</th>
                    <th className="text-left p-2">추천코드</th>
                    <th className="text-left p-2">배너 위치</th>
                    <th className="text-left p-2">사용자 ID</th>
                  </tr>
                </thead>
                <tbody>
                  {clicks.map((click) => (
                    <tr key={click.click_id} className="border-b border-gray-700">
                      <td className="p-2">
                        {new Date(click.created_at).toLocaleString('ko-KR')}
                      </td>
                      <td className="p-2">{click.exchange}</td>
                      <td className="p-2 font-mono">{click.ref_code}</td>
                      <td className="p-2">{click.banner_slot}</td>
                      <td className="p-2 font-mono text-xs">
                        {click.user_id ? click.user_id.substring(0, 8) + '...' : '익명'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
