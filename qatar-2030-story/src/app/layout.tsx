import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Inter } from "next/font/google";
import "./globals.css";
import { LangProvider } from "@/lib/i18n";
import { THEME_BOOT_SCRIPT } from "@/lib/dash/theme";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SourceDrawerProvider } from "@/components/ui/SourceDrawer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  weight: ["400", "600"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "Qatar 2030 Skills Intelligence",
    template: "%s · Qatar 2030 Skills Intelligence",
  },
  description:
    "An interactive dashboard of where Qatar's 2030 strategies ask for more skills than employers hire for today: by economic hub, sector and future. CMU Tepper MSBA Capstone for Qatar Foundation's Qatar Human Capital Manara.",
};

export const viewport: Viewport = {
  themeColor: "#F4F5F7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The theme attribute is set before hydration by the boot script, hence suppressHydrationWarning.
    <html lang="en" className={`${inter.variable} ${plexArabic.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-screen antialiased">
        <LangProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-invert focus:px-4 focus:py-2 focus:text-on-invert"
          >
            Skip to content
          </a>
          <SourceDrawerProvider>
            <SiteHeader />
            <main id="main">{children}</main>
            <SiteFooter />
          </SourceDrawerProvider>
        </LangProvider>
      </body>
    </html>
  );
}
