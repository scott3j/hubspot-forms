import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import { Providers } from "@/components/providers";
import {
  SidebarProvider,
} from "@/components/ui/sidebar";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased  h-screen`}
      >
        <Providers>
          <SidebarProvider
            style={
              {
                "--sidebar-width": "46rem",
              } as React.CSSProperties
            }
          >
            {children}
          </SidebarProvider>
        </Providers>
      </body>
    </html>
  );
}
