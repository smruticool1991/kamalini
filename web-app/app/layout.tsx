import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL('https://kajobs.in'),
  icons: {
    icon: '/app_icon.png',
    apple: '/app_icon.png',
  },
  title: {
    default: 'KA Jobs – Find Jobs, Hire Talent & Build Your Career in India',
    template: '%s | KA Jobs',
  },
  description: 'KA Jobs is India\'s fastest growing job portal. Search thousands of job openings, apply instantly, and connect with top employers across IT, sales, marketing, engineering, healthcare and more.',
  keywords: 'jobs India, job search India, job portal India, find jobs, hire candidates, job openings, fresher jobs, experienced jobs, IT jobs India, sales jobs, marketing jobs, engineering jobs, KA Jobs',
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
    siteName: 'KA Jobs',
    title: 'KA Jobs – Find Jobs, Hire Talent & Build Your Career in India',
    description: 'India\'s fastest growing job portal. Search thousands of job openings and connect with top employers.',
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
    title: 'KA Jobs – Find Jobs & Hire Talent in India',
    description: 'India\'s fastest growing job portal. Search thousands of job openings and connect with top employers.',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://kajobs.in',
  },
};

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
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
