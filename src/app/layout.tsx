import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost, Pinyon_Script } from "next/font/google";
import "./globals.css";

const display = Bodoni_Moda({ subsets: ["latin"], style: ["normal", "italic"], weight: ["400", "500"], variable: "--font-display" });
const script = Pinyon_Script({ subsets: ["latin"], weight: "400", variable: "--font-script" });
const ui = Jost({ subsets: ["latin"], weight: ["300", "400", "500", "600"], variable: "--font-ui" });

export const metadata: Metadata = {
  title: { default: "Unveil Invitations", template: "%s · Unveil" },
  description: "Animated wedding invitations, made in Lebanon.",
};

export const viewport: Viewport = { themeColor: "#2a0d14", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${script.variable} ${ui.variable}`}>
      <body>{children}</body>
    </html>
  );
}
