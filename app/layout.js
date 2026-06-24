import "./globals.css";
import { Inter } from "next/font/google";
import { CONFIG } from "@/lib/config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: `${CONFIG.brandName} ${CONFIG.brandAccent} — ${CONFIG.tagline}`,
  description:
    "Get an instant freight quote. Tell us your route and cargo and we'll reach out with pricing fast.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
