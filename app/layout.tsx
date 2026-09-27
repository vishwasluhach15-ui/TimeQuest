import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TimeQuest — Harappan Civilization",
  description:
    "An interactive journey through the Harappan Civilization — explore, discover, and learn.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-body min-h-screen">{children}</body>
    </html>
  );
}
