// 바이낸스 무료 API 서비스 (API 키 불필요)

export interface BinanceKline {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  numberOfTrades: number
  takerBuyBaseAssetVolume: string
  takerBuyQuoteAssetVolume: string
  ignore: string
}

export interface CandleData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TickerData {
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high24h: number
  low24h: number
}

class BinanceAPI {
  private baseUrl = 'https://data-api.binance.vision/api/v3'
  private wsUrl = 'wss://stream.binance.com:9443/ws'

  // 캔들스틱 데이터 가져오기
  async getKlines(
    symbol: string, 
    interval: string = '1m', 
    limit: number = 500
  ): Promise<CandleData[]> {
    try {
      const url = `${this.baseUrl}/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`)
      }

      const data: BinanceKline[] = await response.json()
      
      return data.map(kline => ({
        time: Math.floor(kline.openTime / 1000), // 초 단위로 변환
        open: parseFloat(kline.open),
        high: parseFloat(kline.high),
        low: parseFloat(kline.low),
        close: parseFloat(kline.close),
        volume: parseFloat(kline.volume),
      }))
    } catch (error) {
      console.error('Failed to fetch Binance klines:', error)
      throw error
    }
  }

  // 24시간 가격 통계
  async getTicker24hr(symbol?: string): Promise<TickerData[]> {
    try {
      const url = symbol 
        ? `${this.baseUrl}/ticker/24hr?symbol=${symbol.toUpperCase()}`
        : `${this.baseUrl}/ticker/24hr`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`)
      }

      const data = await response.json()
      const tickers = Array.isArray(data) ? data : [data]
      
      return tickers.map((ticker: any) => ({
        symbol: ticker.symbol,
        price: parseFloat(ticker.lastPrice),
        change: parseFloat(ticker.priceChange),
        changePercent: parseFloat(ticker.priceChangePercent),
        volume: parseFloat(ticker.volume),
        high24h: parseFloat(ticker.highPrice),
        low24h: parseFloat(ticker.lowPrice),
      }))
    } catch (error) {
      console.error('Failed to fetch Binance ticker:', error)
      throw error
    }
  }

  // 현재 가격만 간단히 가져오기
  async getPrice(symbol: string): Promise<number> {
    try {
      const url = `${this.baseUrl}/ticker/price?symbol=${symbol.toUpperCase()}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Binance API error: ${response.status}`)
      }

      const data = await response.json()
      return parseFloat(data.price)
    } catch (error) {
      console.error('Failed to fetch Binance price:', error)
      throw error
    }
  }

  // WebSocket 연결 (실시간 데이터)
  createWebSocket(
    symbol: string, 
    interval: string = '1m',
    onMessage: (data: CandleData) => void,
    onError?: (error: Event) => void
  ): WebSocket {
    const wsUrl = `${this.wsUrl}/${symbol.toLowerCase()}@kline_${interval}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log(`Connected to Binance WebSocket: ${symbol}`)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        const kline = data.k
        
        if (kline) {
          const candleData: CandleData = {
            time: Math.floor(kline.t / 1000),
            open: parseFloat(kline.o),
            high: parseFloat(kline.h),
            low: parseFloat(kline.l),
            close: parseFloat(kline.c),
            volume: parseFloat(kline.v),
          }
          
          onMessage(candleData)
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (onError) onError(error)
    }

    ws.onclose = () => {
      console.log(`Disconnected from Binance WebSocket: ${symbol}`)
    }

    return ws
  }

  // 여러 심볼의 실시간 가격 스트림
  createMultiTickerStream(
    symbols: string[],
    onMessage: (data: { symbol: string; price: number; change: number }) => void,
    onError?: (error: Event) => void
  ): WebSocket {
    const streams = symbols.map(symbol => `${symbol.toLowerCase()}@ticker`).join('/')
    const wsUrl = `${this.wsUrl}/${streams}`
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      console.log(`Connected to Binance multi-ticker stream`)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.stream && data.data) {
          const ticker = data.data
          onMessage({
            symbol: ticker.s,
            price: parseFloat(ticker.c),
            change: parseFloat(ticker.P),
          })
        }
      } catch (error) {
        console.error('WebSocket message parsing error:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('WebSocket error:', error)
      if (onError) onError(error)
    }

    ws.onclose = () => {
      console.log('Disconnected from Binance multi-ticker stream')
    }

    return ws
  }

  // 인기 암호화폐 심볼 목록
  getPopularCryptoSymbols(): string[] {
    return [
      'BTCUSDT',
      'ETHUSDT', 
      'BNBUSDT',
      'ADAUSDT',
      'SOLUSDT',
      'XRPUSDT',
      'DOTUSDT',
      'DOGEUSDT',
      'AVAXUSDT',
      'MATICUSDT',
      'LINKUSDT',
      'UNIUSDT',
      'LTCUSDT',
      'BCHUSDT',
      'FILUSDT'
    ]
  }

  // 심볼을 사용자 친화적 이름으로 변환
  getDisplayName(symbol: string): string {
    const nameMap: Record<string, string> = {
      'BTCUSDT': '비트코인',
      'ETHUSDT': '이더리움',
      'BNBUSDT': '바이낸스코인',
      'ADAUSDT': '카르다노',
      'SOLUSDT': '솔라나',
      'XRPUSDT': '리플',
      'DOTUSDT': '폴카닷',
      'DOGEUSDT': '도지코인',
      'AVAXUSDT': '아발란체',
      'MATICUSDT': '폴리곤',
      'LINKUSDT': '체인링크',
      'UNIUSDT': '유니스왑',
      'LTCUSDT': '라이트코인',
      'BCHUSDT': '비트코인캐시',
      'FILUSDT': '파일코인',
    }
    
    return nameMap[symbol] || symbol.replace('USDT', '')
  }
}

// 싱글톤 인스턴스
export const binanceAPI = new BinanceAPI()

// 사용 예시:
/*
// 1. 캔들스틱 데이터 가져오기
const candles = await binanceAPI.getKlines('BTCUSDT', '1m', 100)

// 2. 실시간 가격 스트림
const ws = binanceAPI.createWebSocket('BTCUSDT', '1m', (data) => {
  console.log('New candle:', data)
})

// 3. 여러 코인 가격 모니터링
const multiWs = binanceAPI.createMultiTickerStream(
  ['BTCUSDT', 'ETHUSDT'], 
  (data) => {
    console.log(`${data.symbol}: $${data.price} (${data.change}%)`)
  }
)

// 4. WebSocket 연결 해제
ws.close()
multiWs.close()
*/
