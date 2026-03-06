import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Eventku.co.id — Platform Manajemen Event Modern untuk Event Organizer Indonesia",
  description: "Eventku adalah platform manajemen event all-in-one untuk Event Organizer Indonesia. Kelola pendaftaran peserta, check-in digital, doorprize, dan laporan event dalam satu sistem terintegrasi.",
  keywords: ["Eventku", "event management", "doorprize", "undian", "check-in", "EO Indonesia", "event organizer"],
  authors: [{ name: "Eventku Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Eventku - Platform Manajemen Event Modern",
    description: "Platform manajemen event all-in-one untuk Event Organizer Indonesia",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Eventku - Platform Manajemen Event Modern",
    description: "Platform manajemen event all-in-one untuk Event Organizer Indonesia",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="doorprize-theme"
        >
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
