import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Orbitron } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ViewportHeightFix } from "@/components/ViewportHeightFix";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });

export const metadata: Metadata = {
  title: "Relationship War Room",
  description: "A collaborative, gamified CRM for dating within a friend group.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "War Room",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#05050A",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="width" />
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} ${orbitron.variable} antialiased bg-deep-void text-foreground overflow-hidden touch-manipulation`}
      >
        <ViewportHeightFix />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
