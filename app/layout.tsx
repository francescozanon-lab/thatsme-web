import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "That's Me — Area psicologi",
  description: "Pannello psicologi di That's Me",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning: alcune estensioni del browser (es. ColorZilla,
          `cz-shortcut-listen`) iniettano attributi sul <body> prima dell'hydration.
          Sopprime la discrepanza SOLO su questo elemento, non sui figli: gli errori
          di hydration veri nelle pagine restano visibili. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
