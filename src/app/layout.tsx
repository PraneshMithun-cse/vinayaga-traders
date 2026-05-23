import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AdminProvider } from "@/context/AdminContext";
import { LocationProvider } from "@/context/LocationContext";
import CapacitorBridge from "@/components/CapacitorBridge";

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["200", "300", "400", "600", "700", "800"],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Fresh Groceries Delivered Fast | Vinayaga Traders",
  description:
    "Order groceries online from Vinayaga Traders. Get fresh vegetables, fruits, dairy, bread, eggs, meat and more delivered to your doorstep in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} h-full`}>
      <body className="min-h-full bg-white"><AdminProvider><LocationProvider><CartProvider><CapacitorBridge />{children}</CartProvider></LocationProvider></AdminProvider></body>
    </html>
  );
}
