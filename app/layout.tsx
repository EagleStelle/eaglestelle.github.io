import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_ALIASES, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const description = `Portfolio of ${SITE_NAME}, also known as ${SITE_ALIASES.join(" or ")}.`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "profile",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: SITE_TITLE,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased scroll-smooth scroll-pt-16"
      suppressHydrationWarning
    >
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-clip">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
