import type { Metadata, Viewport } from "next";
import { Recursive } from "next/font/google";
import "./globals.css";

// One variable family, three voices: sans (interface), CASL (user's notes), MONO (measurements).
const recursive = Recursive({
  variable: "--font-recursive",
  subsets: ["latin"],
  axes: ["CASL", "MONO", "slnt"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Jarlore — Remember what worked. Brew it again.",
    template: "%s · Jarlore",
  },
  description:
    "Your personal fermentation workspace to track every batch, learn from every experiment, and recreate your best ferments.",
};

export const viewport: Viewport = {
  themeColor: "#f2f3ee",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${recursive.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
