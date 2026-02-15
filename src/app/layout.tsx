import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { OrganizationSchema } from "@/components/structured-data";
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
  metadataBase: new URL("https://openshut.me"),
  title: {
    default: "OpenShut | Legal Automation & Deal Tools for Private Equity",
    template: "%s | OpenShut",
  },
  description:
    "Legal automation and deal tools for PE firms and family offices. Generate deal terms, PPMs, loan packages, closing checklists, and compliance reports. 59 document types. Ready in minutes.",
  keywords: [
    "legal automation",
    "deal terms",
    "deal terms generation",
    "PE tools",
    "deal tools",
    "private equity tools",
    "legal document automation",
    "deal document generation",
    "PE document automation",
    "private equity deal tools",
    "fund formation automation",
    "loan document generation",
    "M&A deal tools",
    "PPM generator",
    "closing checklist automation",
    "due diligence automation",
    "syndication documents",
    "fund compliance automation",
    "LP reporting tools",
    "capital call automation",
    "deal structuring software",
    "PE workflow automation",
  ],
  authors: [{ name: "OpenShut" }],
  creator: "OpenShut",
  publisher: "OpenShut",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://openshut.me",
    siteName: "OpenShut",
    title: "OpenShut | Legal Automation & Deal Tools for Private Equity",
    description:
      "Legal automation and deal tools for PE firms. Generate deal terms, loan packages, PPMs, and compliance reports. 59 document types across 5 modules.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "OpenShut - Legal Document Automation",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenShut | Legal Automation & Deal Tools for Private Equity",
    description:
      "Legal automation and deal tools for PE firms. Generate deal terms, PPMs, loan packages, and compliance reports.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://openshut.me",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <OrganizationSchema />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
