import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ORATORIA - Speak German",
  description: "AI-first, competence-driven language learning engine for busy professionals learning German.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
