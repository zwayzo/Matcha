import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { AuthProvider } from "@/lib/auth-context"
import "./globals.css"
import SnowfallComponent from "@/components/snowfall"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Linder - Where Professionals Match",
  description:
    "Hire Your Perfect Professional Match",
  generator: "+212 TEAM",
  icons: {
    icon: "/linder-icon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans antialiased`} suppressHydrationWarning={true}>
        <AuthProvider>
          {children}
          <Analytics />
        </AuthProvider>
        <SnowfallComponent />
      </body>
    </html>
  )
}
