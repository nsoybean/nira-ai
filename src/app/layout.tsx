import type { Metadata } from "next";
import { Geist, Geist_Mono, REM } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BetaAuthProvider } from "@/contexts/BetaAuthContext";
import { ClientInit } from "@/components/ClientInit";
import { QueryProvider } from "@/contexts/QueryClientProvider";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ConversationsProvider } from "@/contexts/ConversationsContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const rem = REM({
  variable: "--font-rem",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
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
        className={`${geistSans.variable} ${geistMono.variable} ${rem.variable} antialiased`}
      >
        <ClientInit />
        <QueryProvider>
          <ThemeProvider>
            <TooltipProvider>
              <ConversationsProvider>
                <BetaAuthProvider>{children}</BetaAuthProvider>
              </ConversationsProvider>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
