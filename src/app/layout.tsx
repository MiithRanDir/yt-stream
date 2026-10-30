import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SwRegister } from "@/components/sw-register";

export const metadata: Metadata = {
  title: "YT Stream — คีย์ไลฟ์ YouTube",
  description:
    "สร้างและจัดการ stream key สำหรับไลฟ์ YouTube จากมือถือ ติดตั้งเป็น PWA ได้",
  applicationName: "YT Stream",
  appleWebApp: {
    capable: true,
    title: "YT Stream",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-app text-ink">
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
