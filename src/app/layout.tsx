import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BetaAuthProvider } from "@/contexts/BetaAuthContext";
import { ClientInit } from "@/components/ClientInit";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nira - AI Chat Assistant",
  description: "Chat with Claude 3.5 Sonnet - Your intelligent AI assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientInit />
        <ThemeProvider>
          <BetaAuthProvider>{children}</BetaAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
