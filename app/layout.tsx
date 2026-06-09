import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SWRegister } from "./sw-register";

export const metadata: Metadata = {
  title: "SideQuest",
  description: "Один персональний сайд-квест щодня.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "SideQuest" },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
