import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "KickOff-Hub | Manage Your Leagues",
  description: "Premium football tracking and game organization platform. Organize matches, teams, and track real-time scores effortlessly.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <main className="container">
            {children}
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
