import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "DigiClassroom",
  description: "AI-ready learning management platform for modern educational institutions."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Watermark Logo */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] scale-[2]">
            <img 
              src="/mylogo.jpeg" 
              alt="DigiClassroom Logo Watermark" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>
        <div className="relative z-10">
          <ClientLayout>{children}</ClientLayout>
        </div>
      </body>
    </html>
  );
}
