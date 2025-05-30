import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/providers/AuthProvider";
import { CartProvider } from "@/contexts/CartContext";
import QueryProvider from "@/providers/QueryProvider";
import ServiceWorkerProvider from "@/providers/ServiceWorkerProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Extreme Life Herbal Product Rewards",
  description: "Extreme Life Herbal Products Trading rewards program for distributors",
  manifest: "/manifest.json",
  icons: {
    icon: "/images/20250503.svg",
    apple: "/images/20250503.svg"
  },
  themeColor: "#4CAF50"
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
        <AuthProvider>
          <QueryProvider>
            <CartProvider>
              <ServiceWorkerProvider>
                {children}
              </ServiceWorkerProvider>
            </CartProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
