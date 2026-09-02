import type { Metadata } from "next";
import { Hubot_Sans, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const hubotSans = Hubot_Sans({ variable: "--font-hubot-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lupio — 24/7 Stream Manager",
  description: "Stream. Loop. Stay Live.",
  icons: {
    icon: "/lupio-icon.jpg",
    shortcut: "/lupio-icon.jpg",
    apple: "/lupio-icon.jpg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${hubotSans.variable} ${geistMono.variable} h-full`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem("lupio_theme");
                  if (saved === "light") {
                    document.documentElement.setAttribute("data-theme", "light");
                    document.documentElement.classList.add("light");
                  } else {
                    document.documentElement.setAttribute("data-theme", "dark");
                    document.documentElement.classList.add("dark");
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="flex h-full overflow-hidden bg-background text-foreground font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
