import type { Metadata } from "next";
import "./globals.css";
import "@/styles/slide-theme.css";

export const metadata: Metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Executive Pitch Generator",
  description: "Generate executive sales pitch presentations from a project transcript."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
