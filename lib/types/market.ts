import { z } from 'zod'

// 시장 카테고리
export const MarketCategorySchema = z.object({
  id: z.number(),
  code: z.string(),
  name_ko: z.string(),
  name_en: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type MarketCategory = z.infer<typeof MarketCategorySchema>

// 자산 유형
export const AssetTypeSchema = z.enum(['STOCK', 'CRYPTO', 'ETF', 'INDEX'])
export type AssetType = z.infer<typeof AssetTypeSchema>

// 자산 정보
export const AssetSchema = z.object({
  id: z.number(),
  symbol: z.string(),
  name: z.string(),
  name_ko: z.string().nullable(),
  market_category_id: z.number(),
  asset_type: AssetTypeSchema,
  exchange: z.string().nullable(),
  currency: z.string(),
  logo_url: z.string().nullable(),
  description: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
})

export type Asset = z.infer<typeof AssetSchema>

// 시세 데이터
export const MarketPriceSchema = z.object({
  id: z.number(),
  asset_id: z.number(),
  price: z.number(),
  change_amount: z.number().nullable(),
  change_percent: z.number().nullable(),
  volume: z.number().nullable(),
  market_cap: z.number().nullable(),
  high_24h: z.number().nullable(),
  low_24h: z.number().nullable(),
  timestamp: z.string(),
  source: z.string(),
})

export type MarketPrice = z.infer<typeof MarketPriceSchema>

// 일봉 데이터
export const DailyCandleSchema = z.object({
  id: z.number(),
  asset_id: z.number(),
  date: z.string(),
  open_price: z.number(),
  high_price: z.number(),
  low_price: z.number(),
  close_price: z.number(),
  volume: z.number(),
  adj_close: z.number().nullable(),
  created_at: z.string(),
})

export type DailyCandle = z.infer<typeof DailyCandleSchema>

// 관심종목
export const WatchlistSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  asset_id: z.number(),
  added_at: z.string(),
})

export type Watchlist = z.infer<typeof WatchlistSchema>

// 포트폴리오
export const PortfolioSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  name: z.string(),
  is_default: z.boolean(),
  total_value: z.number(),
  created_at: z.string(),
})

export type Portfolio = z.infer<typeof PortfolioSchema>

// 보유 종목
export const HoldingSchema = z.object({
  id: z.number(),
  portfolio_id: z.number(),
  asset_id: z.number(),
  quantity: z.number(),
  avg_buy_price: z.number(),
  total_invested: z.number(),
  current_value: z.number().nullable(),
  profit_loss: z.number().nullable(),
  profit_loss_percent: z.number().nullable(),
  last_updated: z.string(),
})

export type Holding = z.infer<typeof HoldingSchema>

// 거래 내역
export const TransactionTypeSchema = z.enum(['BUY', 'SELL'])
export type TransactionType = z.infer<typeof TransactionTypeSchema>

export const TransactionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  portfolio_id: z.number(),
  asset_id: z.number(),
  transaction_type: TransactionTypeSchema,
  quantity: z.number(),
  price: z.number(),
  total_amount: z.number(),
  fee: z.number(),
  executed_at: z.string(),
})

export type Transaction = z.infer<typeof TransactionSchema>

// 커뮤니티 게시글
export const PostTypeSchema = z.enum(['ANALYSIS', 'NEWS', 'DISCUSSION', 'QUESTION'])
export type PostType = z.infer<typeof PostTypeSchema>

export const CommunityPostSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  asset_id: z.number().nullable(),
  title: z.string(),
  content: z.string(),
  post_type: PostTypeSchema,
  tags: z.array(z.string()),
  like_count: z.number(),
  comment_count: z.number(),
  view_count: z.number(),
  is_featured: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type CommunityPost = z.infer<typeof CommunityPostSchema>

// AI 분석
export const AnalysisTypeSchema = z.enum(['TECHNICAL', 'SENTIMENT', 'PATTERN'])
export const SignalSchema = z.enum(['BUY', 'SELL', 'HOLD'])

export const AIAnalysisSchema = z.object({
  id: z.number(),
  asset_id: z.number(),
  analysis_type: AnalysisTypeSchema,
  signal: SignalSchema,
  confidence: z.number().nullable(),
  reasoning: z.string().nullable(),
  indicators: z.record(z.any()).nullable(),
  created_at: z.string(),
})

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>

// API 요청/응답 스키마
export const GetMarketDataRequestSchema = z.object({
  symbols: z.array(z.string()).optional(),
  category: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
})

export const GetMarketDataResponseSchema = z.object({
  assets: z.array(AssetSchema),
  prices: z.array(MarketPriceSchema),
  total: z.number(),
})

export const GetWatchlistResponseSchema = z.array(z.object({
  ...WatchlistSchema.shape,
  asset: AssetSchema,
  price: MarketPriceSchema.nullable(),
}))

export const AddToWatchlistRequestSchema = z.object({
  assetId: z.number(),
})

export const GetPortfolioResponseSchema = z.object({
  portfolio: PortfolioSchema,
  holdings: z.array(z.object({
    ...HoldingSchema.shape,
    asset: AssetSchema,
    current_price: MarketPriceSchema.nullable(),
  })),
  total_value: z.number(),
  total_profit_loss: z.number(),
  total_profit_loss_percent: z.number(),
})

export const ExecuteTradeRequestSchema = z.object({
  portfolioId: z.number(),
  assetId: z.number(),
  type: TransactionTypeSchema,
  quantity: z.number().positive(),
  price: z.number().positive(),
})

export const GetCommunityPostsRequestSchema = z.object({
  type: PostTypeSchema.optional(),
  assetId: z.number().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(50).default(20),
})

export const CreatePostRequestSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  postType: PostTypeSchema,
  assetId: z.number().optional(),
  tags: z.array(z.string()).max(5).optional(),
})

// 유틸리티 타입
export interface AssetWithPrice extends Asset {
  current_price?: MarketPrice
  market_category?: MarketCategory
}

export interface HoldingWithAsset extends Holding {
  asset: Asset
  current_price?: MarketPrice | null
}

export interface PostWithAuthor extends CommunityPost {
  author: {
    id: string
    handle: string | null
  }
  asset?: Asset
}

// 차트 데이터 타입
export interface ChartDataPoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// 대시보드 데이터 타입
export interface DashboardData {
  topMovers: AssetWithPrice[]
  userWatchlist: AssetWithPrice[]
  marketOverview: {
    totalMarketCap: number
    totalVolume24h: number
    btcDominance: number
    activeAssets: number
  }
  recentPosts: PostWithAuthor[]
}

// 검색 결과 타입
export interface SearchResult {
  assets: Asset[]
  posts: PostWithAuthor[]
}

export type GetMarketDataRequest = z.infer<typeof GetMarketDataRequestSchema>
export type GetMarketDataResponse = z.infer<typeof GetMarketDataResponseSchema>
export type GetWatchlistResponse = z.infer<typeof GetWatchlistResponseSchema>
export type AddToWatchlistRequest = z.infer<typeof AddToWatchlistRequestSchema>
export type GetPortfolioResponse = z.infer<typeof GetPortfolioResponseSchema>
export type ExecuteTradeRequest = z.infer<typeof ExecuteTradeRequestSchema>
export type GetCommunityPostsRequest = z.infer<typeof GetCommunityPostsRequestSchema>
export type CreatePostRequest = z.infer<typeof CreatePostRequestSchema>
