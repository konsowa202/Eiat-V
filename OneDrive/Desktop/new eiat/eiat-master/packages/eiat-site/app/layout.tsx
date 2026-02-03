import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/nav-bar";

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
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ar" dir="rtl">
            <body className={`${cairo.className} antialiased w-full`}>
                <Navbar />
                {children}
            </body>
        </html>
    );
}
