import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "إيات - لوحة التحكم | EIAT Studio",
  description: "لوحة تحكم مجمع عيادات إيات الطبي (Sanity Studio).",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="ltr">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
