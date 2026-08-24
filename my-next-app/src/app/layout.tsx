import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import ReduxProvider from "@/components/ReduxProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cravingza | Order food you'll crave",
  description: "Delicious food from your favorite local restaurants delivered fast to your doorstep.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-background font-sans">
        <ReduxProvider>
          {children}
        </ReduxProvider>
        <Toaster position="top-center" duration={3000} visibleToasts={1} closeButton />
      </body>
    </html>
  );
}

