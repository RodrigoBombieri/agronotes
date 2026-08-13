import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { AppHeader } from "@/components/app-header";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Agronotes — Panel",
  description: "Panel web de Agronotes: cuaderno de campo digital",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <a
          href="#contenido-principal"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-brand-900 focus:shadow-md"
        >
          Saltar al contenido principal
        </a>
        <AppHeader />
        <main id="contenido-principal" className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
