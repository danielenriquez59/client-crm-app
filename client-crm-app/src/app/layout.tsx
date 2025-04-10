import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Client CRM",
  description: "A lightweight client relationship management application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-border bg-card py-4">
            <div className="container mx-auto px-4">
              <Link href="/">
                <h2 className="text-2xl font-bold text-primary hover:drop-shadow-md active:drop-shadow-lg">Client CRM</h2>
              </Link>
            </div>
          </header>
          <main className="flex-1 container mx-auto px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-border py-4 text-center text-sm text-muted-foreground">
            <div className="container mx-auto px-4">
              Client CRM &copy; {new Date().getFullYear()}
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
