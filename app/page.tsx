export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-2xl">📈</div>
            <h1 className="text-xl font-bold text-gray-800">
              Errdaycoin
            </h1>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="text-5xl font-bold text-gray-900 mb-6">
            암호화폐 트레이딩 게임 플랫폼
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            실시간 차트를 보고 매수/매도 타이밍을 맞춰보세요. 
            가상 자금으로 안전하게 트레이딩을 연습할 수 있습니다.
          </p>
          
          <div className="flex gap-4 justify-center mb-12">
            <a 
              href="/play" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              게임 시작하기
            </a>
            <a 
              href="/dashboard" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition-colors"
            >
              대시보드 보기
            </a>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">실시간 데이터</h3>
              <p className="text-gray-600">실제 암호화폐 시장 데이터를 활용한 리얼타임 트레이딩</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">🏆</div>
              <h3 className="text-lg font-semibold mb-2">리더보드</h3>
              <p className="text-gray-600">다른 플레이어들과 수익률을 비교하고 경쟁하세요</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-4">📊</div>
              <h3 className="text-lg font-semibold mb-2">포트폴리오 관리</h3>
              <p className="text-gray-600">투자 내역과 수익률을 한눈에 확인하고 분석하세요</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}