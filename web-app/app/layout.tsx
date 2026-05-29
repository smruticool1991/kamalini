import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KA Jobs - Job Board",
  description: "Find the job that fits your life",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/fonts/fonts.css" />
        <link rel="stylesheet" href="/fonts/icon-font.css" />
        <link rel="stylesheet" href="/bootstrap.min.css" />
        <link rel="stylesheet" href="/animate.css" />
        <link rel="stylesheet" href="/shortcodes.css" />
        <link rel="stylesheet" href="/style.css" />
        <link rel="stylesheet" href="/responsive.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
