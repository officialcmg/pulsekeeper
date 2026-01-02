import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/providers/AppProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PulseKeeper - Your crypto stays safe, even when you can't access it",
  description: "Non-custodial crypto recovery powered by MetaMask Advanced Permissions. Set up backups, check in periodically, and if you ever go inactive, your funds automatically flow to the people you trust.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-full font-geist-sans antialiased flex flex-col bg-white dark:bg-black text-black dark:text-white`}
      >
        <div className="flex-1">
          <main>
            <AppProvider>
              {children}
            </AppProvider>
          </main>
        </div>
      </body>
    </html>
  );
}