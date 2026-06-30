import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";
import { getI18n } from "@/lib/i18n/server";
import { I18nProvider } from "@/lib/i18n/provider";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "GruBet", template: "%s · GruBet" },
  description: "שוק הניבויים של כל קבוצת חברים — פתחו הימור, הזמינו את החבר׳ה, וראו מי צדק.",
  applicationName: "GruBet",
  openGraph: { title: "GruBet", description: "שוק הניבויים של כל קבוצת חברים.", type: "website" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dir, dict } = await getI18n();
  return (
    <html lang={locale} dir={dir} className={`${heebo.variable} h-full antialiased`}>
      <body className="min-h-full">
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
