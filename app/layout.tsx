import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Northwind Pay",
  description: "Checkout and refunds console",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <header className="border-b border-slate-200 bg-white">
          <nav className="mx-auto flex max-w-5xl items-center gap-8 px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Northwind Pay
            </Link>
            <div className="flex gap-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-slate-900">
                Checkout
              </Link>
              <Link href="/ops" className="hover:text-slate-900">
                Transactions
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
