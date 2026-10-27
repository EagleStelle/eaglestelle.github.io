import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { displayName, displayTitle, getProfile } from "@/lib/profile";
import { SITE_URL } from "@/lib/site";
import { themeScript } from "@/lib/theme-script";
import { cn } from "@/lib/utils";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  const name = displayName(profile);
  const title = displayTitle(profile);
  const aliases = profile?.aliases ?? [];
  const description = aliases.length
    ? `Portfolio of ${name}, also known as ${aliases.join(" or ")}.`
    : `Portfolio of ${name}.`;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: title,
      template: `%s | ${name}`,
    },
    description,
    applicationName: name,
    authors: [{ name, url: SITE_URL }],
    creator: name,
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "profile",
      siteName: name,
      url: SITE_URL,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(archivo.variable, "h-full antialiased")}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full w-full max-w-full flex-col overflow-x-clip">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-60 focus:rounded-md focus:bg-primary focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-primary-foreground"
        >
          Skip to content
        </a>
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
