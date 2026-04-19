import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { ReactLenis } from "lenis/react";
import "../globals.css";
import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import { Toaster } from "sonner";
import WhatsApp from "@/components/whats-app";
import Script from "next/script";

const cairo = Cairo({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  icons: {
    icon: "/1.png",
    apple: "/1.png",
  },
  title: "EIAT Medical Clinics | مجمع عيادات إيات الطبي",
  description:
    "مجمع عيادات إيات الطبي - أسنان، جلدية، وليزر. رعاية طبية متكاملة بأحدث التقنيات وأفضل الخبراء. احجز موعدك الآن.",
  keywords: [
    "عيادات إيات",
    "عيادة إيات",
    "جلدية",
    "ليزر",
    "أسنان",
    "تجميل الأسنان",
    "إزالة الشعر بالليزر",
    "حقن تجميلي",
    "EIAT Clinics",
  ],
  authors: [
    {
      name: "EIAT Medical",
    },
  ],
  generator: "Next.js",
  applicationName: "EIAT Medical Clinics",
  creator: "EIAT Medical",
  publisher: "EIAT Medical",
  openGraph: {
    title: "EIAT Medical Clinics | مجمع عيادات إيات الطبي",
    description:
      "خدمات طبية شاملة في الأسنان والجلدية والليزر. نحرص على تقديم أفضل رعاية باستخدام أحدث الأجهزة.",
    url: "https://eiatclinic.com",
    siteName: "EIAT Medical Clinics",
    locale: "ar_SA",
    type: "website",
    images: [
      {
        url: "/og-image.webp", // Consider updating this image later
        width: 1200,
        height: 630,
        alt: "EIAT Medical Clinics - رعاية متكاملة",
      },
      {
        url: "/logo.ico",
        width: 500,
        height: 500,
        alt: "EIAT Logo",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "EIAT Medical Clinics | مجمع عيادات إيات الطبي",
    description: "أسنان، جلدية، ليزر - رعاية طبية شاملة بأيدي خبراء.",
    images: ["/og-image.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* Google Tag Manager */}
        <Script id="gtm-script" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-MQP4MGN');`}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body
        className={`${cairo.className}  antialiased overflow-x-hidden w-full`}
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-MQP4MGN"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <ReactLenis root options={{ smoothWheel: true }} />
        <NavBar />
        {children}
        <WhatsApp />
        <Toaster richColors position="top-right" />
        <Footer />
      </body>
    </html>
  );
}
