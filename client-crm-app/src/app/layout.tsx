import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Client CRM",
  description: "A simple CRM for managing client interactions",
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
              <div className="flex justify-between items-center">
                <Link href="/" aria-label="home">
                  <h2 className="text-2xl font-bold text-primary hover:drop-shadow-lg active:drop-shadow-md">Client CRM</h2>
                </Link>
                <nav className="flex space-x-4">
                  <Link href="/" className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                    Dashboard
                  </Link>
                  <Link href="/clients" className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                    Clients
                  </Link>
                  <Link href="/interactions" className="px-3 py-2 rounded-md hover:bg-accent hover:text-accent-foreground">
                    Interactions
                  </Link>
                </nav>
              </div>
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
