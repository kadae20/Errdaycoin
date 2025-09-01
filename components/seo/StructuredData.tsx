'use client'

import { useTranslation } from 'react-i18next'

const StructuredData = () => {
  const { t, i18n } = useTranslation()

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Errdaycoin",
    "applicationCategory": "GameApplication",
    "applicationSubCategory": "Educational Trading Game",
    "description": "Ultimate chart game and trading simulator! Learn day trading, stock trading game, crypto trading game, forex simulator. Practice trading stocks with virtual trading platform. Free paper trading web for beginners.",
    "url": process.env.NEXT_PUBLIC_SITE_URL || "https://errdaycoin.com",
    "operatingSystem": "Web Browser",
    "browserRequirements": "Requires JavaScript",
    "softwareVersion": "1.0.0",
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "inLanguage": ["en", "ko", "ja", "zh", "es", "fr"],
    "isAccessibleForFree": true,
    "creator": {
      "@type": "Organization",
      "name": "Errdaycoin",
      "url": process.env.NEXT_PUBLIC_SITE_URL || "https://errdaycoin.com"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "featureList": [
      "Chart game with real-time data",
      "Stock trading game simulator",
      "Crypto trading game platform",
      "Forex trading simulator",
      "Day trading simulator",
      "Paper trading web",
      "Buy or sell game challenges",
      "Market timing game practice",
      "Investment game education",
      "Trading quiz game competitions",
      "Chart prediction game",
      "Virtual trading platform",
      "Learn day trading strategies",
      "Practice trading stocks safely"
    ],
    "screenshot": `${process.env.NEXT_PUBLIC_SITE_URL || "https://errdaycoin.com"}/og-image.png`,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1250"
    },
    "keywords": [
      "chart game",
      "trading game",
      "market timing game", 
      "day trading simulator",
      "stock trading game",
      "crypto trading game",
      "futures trading simulator",
      "forex trading simulator",
      "investment game",
      "trading quiz game",
      "chart prediction game",
      "stock market simulator",
      "paper trading web",
      "buy or sell game",
      "trading challenge",
      "virtual trading platform",
      "learn day trading",
      "practice trading stocks"
    ]
  }

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": process.env.NEXT_PUBLIC_SITE_URL || "https://errdaycoin.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Chart Game",
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://errdaycoin.com"}/play`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Trading Simulator",
        "item": `${process.env.NEXT_PUBLIC_SITE_URL || "https://errdaycoin.com"}/dashboard`
      }
    ]
  }

  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is Errdaycoin chart game?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Errdaycoin is the ultimate chart game and trading simulator that helps users learn day trading, stock trading, crypto trading, and forex trading through interactive gameplay with real-time market data. It's a comprehensive virtual trading platform for beginners and pros."
        }
      },
      {
        "@type": "Question", 
        "name": "How does the trading simulator work?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our trading simulator uses real-time cryptocurrency data from Binance. Users can practice day trading, analyze candlestick patterns, and make predictions about market movements without risking real money."
        }
      },
      {
        "@type": "Question",
        "name": "Is Errdaycoin free to use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, Errdaycoin is completely free to use. You can access all trading games, stock trading simulator, crypto trading game, forex simulator, paper trading web, and all features without any cost."
        }
      },
      {
        "@type": "Question",
        "name": "What cryptocurrencies are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We support major cryptocurrencies including Bitcoin (BTC), Ethereum (ETH), Binance Coin (BNB), Cardano (ADA), Solana (SOL), and many others with real-time price data."
        }
      },
      {
        "@type": "Question",
        "name": "Can beginners use this trading simulator?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! Errdaycoin is designed for both beginners and experienced traders. Our chart game, stock trading simulator, and paper trading web help beginners learn day trading, practice trading stocks, and master market timing in a completely risk-free environment."
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
      />
    </>
  )
}

export default StructuredData
