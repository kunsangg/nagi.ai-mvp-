import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Nagi Research OS",
  description: "Navigate the ocean of research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased h-screen overflow-hidden flex bg-perplex-bg text-perplex-text selection:bg-perplex-surface">
        {children}
      </body>
    </html>
  );
}
