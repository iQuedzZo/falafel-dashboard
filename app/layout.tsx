import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/components/app-shell";
import DemoDisclaimer from "@/components/DemoDisclaimer";

export const metadata: Metadata = {
  title: "Falafel Flare Dashboard",
  description: "Restaurant order management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DemoDisclaimer />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}