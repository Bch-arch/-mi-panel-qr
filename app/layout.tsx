import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panel QR · Códigos dinámicos",
  description: "Panel privado para administrar códigos QR dinámicos.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
