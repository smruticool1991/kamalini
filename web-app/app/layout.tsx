import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://kajobs.in'),
  icons: {
    icon: '/app_icon.png',
    apple: '/app_icon.png',
  },
  title: {
    default: 'Jobs in Odisha 2026 – Bhubaneswar New Fresher’s, Private, Govt, Female, Jobs',
    template: '%s | KA JOBS',
  },
  description: 'Daily updated jobs in Bhubaneswar Odisha 2026. Verified new Fresher’s, Private, Govt, Female Jobs in all sectors like IT, banking, BPO, Healthcare. Apply free on kajobs.in.',
  keywords: 'jobs India, job search India, job portal India, find jobs, hire candidates, job openings, fresher jobs, experienced jobs, IT jobs India, sales jobs, marketing jobs, engineering jobs, training India, KA Jobs',
  authors: [{ name: 'KA Jobs' }],
  creator: 'KA Jobs',
  publisher: 'KA Jobs',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://kajobs.in',
    siteName: 'KA JOBS',
    title: 'Jobs in Odisha 2026 – Bhubaneswar New Fresher’s, Private, Govt, Female, Jobs',
    description: 'Daily updated jobs in Bhubaneswar Odisha 2026. Verified new Fresher’s, Private, Govt, Female Jobs in all sectors like IT, banking, BPO, Healthcare. Apply free on kajobs.in.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'KA Jobs – India\'s Job Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jobs in Odisha 2026 – Bhubaneswar New Fresher’s, Private, Govt, Female, Jobs',
    description: 'Daily updated jobs in Bhubaneswar Odisha 2026. Verified new Fresher’s, Private, Govt, Female Jobs in all sectors like IT, banking, BPO, Healthcare. Apply free on kajobs.in.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://kajobs.in',
  },
  verification: {
    google: 'HFwQkIJMizcirM_nT59vsGr6zu197liW46ZwbV5nrAA',
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'KA JOBS',
  url: 'https://kajobs.in',
  logo: 'https://kajobs.in/logo.png',
  sameAs: [
    'https://www.facebook.com/hr.kamalini',
    'https://in.linkedin.com/company/kamalini-associates',
    'https://x.com/XKAJOBS',
    'https://www.instagram.com/hrkamalini/',
    'https://www.youtube.com/@kamaliniassociates',
    'https://wa.me/message/6XMKT3X6OCO4N1',
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="stylesheet" href="/fonts/icon-font.css" />
        <link rel="stylesheet" href="/bootstrap.min.css" />
        <link rel="stylesheet" href="/animate.css" />
        <link rel="stylesheet" href="/shortcodes.css" />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/responsive.css" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-Y9NBZBL5V1"
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-Y9NBZBL5V1');
          `}
        </Script>
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
