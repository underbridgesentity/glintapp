import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ServiceWorker } from "@/components/service-worker";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Glint",
  description:
    "Your car is cleaned while you work. Eco-friendly, water-efficient washing at office parks and estates.",
};

export const viewport: Viewport = {
  themeColor: "#0C0C0C",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-dvh bg-carbon text-white antialiased">
        {children}
        <ServiceWorker />
      </body>
    </html>
  );
}
