'use client'

import { usePathname } from 'next/navigation'

export default function StructuredData() {
  const pathname = usePathname()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://errdaycoin.com'
  const currentUrl = `${baseUrl}${pathname}`

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ErrdayCoin",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.jpg`,
    "description": "Free crypto futures trading simulator game for learning and practice",
    "sameAs": [
      "https://twitter.com/errdaycoin",
      "https://github.com/errdaycoin"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "email": "support@errdaycoin.com"
    }
  }

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "ErrdayCoin",
    "url": baseUrl,
    "description": "Master crypto futures trading with our free interactive simulator! Practice with real Bitcoin & Ethereum charts, learn leverage trading up to 100x, and compete on leaderboards.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  }

  const gameSchema = {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    "name": "ErrdayCoin - Crypto Futures Trading Simulator",
    "description": "Free crypto futures trading simulator game where players practice trading with real Bitcoin and Ethereum charts using leverage up to 100x",
    "url": `${baseUrl}/play`,
    "genre": "Educational Game",
    "gamePlatform": "Web Browser",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "author": {
      "@type": "Organization",
      "name": "ErrdayCoin Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "ErrdayCoin"
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "inLanguage": "en",
    "isAccessibleForFree": true,
    "playMode": "SinglePlayer",
    "gameItem": [
      {
        "@type": "Thing",
        "name": "Bitcoin Trading",
        "description": "Practice trading Bitcoin futures with real chart data"
      },
      {
        "@type": "Thing", 
        "name": "Ethereum Trading",
        "description": "Practice trading Ethereum futures with real chart data"
      },
      {
        "@type": "Thing",
        "name": "Leverage Trading",
        "description": "Learn leverage trading up to 100x with risk management"
      }
    ]
  }

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      },
      ...(pathname !== '/' ? [{
        "@type": "ListItem",
        "position": 2,
        "name": pathname.charAt(1).toUpperCase() + pathname.slice(2),
        "item": currentUrl
      }] : [])
    ]
  }

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is ErrdayCoin?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ErrdayCoin is a free crypto futures trading simulator game where you can practice trading with real Bitcoin and Ethereum charts using leverage up to 100x without any financial risk."
        }
      },
      {
        "@type": "Question",
        "name": "Is ErrdayCoin free to play?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ErrdayCoin is completely free to play. You can start as a guest with 1 token or create an account for 15 tokens and daily resets."
        }
      },
      {
        "@type": "Question",
        "name": "Can I learn real trading skills?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! ErrdayCoin uses real historical chart data from Binance, so you can learn actual trading patterns, risk management, and leverage trading strategies in a safe environment."
        }
      },
      {
        "@type": "Question",
        "name": "What leverage can I use?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can practice with leverage up to 100x, just like real crypto futures trading. This helps you understand the risks and rewards of high-leverage trading."
        }
      },
      {
        "@type": "Question",
        "name": "How do I get more tokens?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "You can get more tokens by watching ads, inviting friends (both get +3 tokens), or waiting for daily resets at midnight US time if you're logged in."
        }
      }
    ]
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(gameSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  )
}
