import type { Metadata } from "next";
import "./globals.css"; // ここであなたの style.css (globals.css) を読み込んでいます

export const metadata: Metadata = {
  title: "ハッピーメモリー",
  description: "日々の幸せを記録するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head>
        {/* Google Fonts (Kaisei Opti) */}
        <link href="https://fonts.googleapis.com/css2?family=Kaisei+Opti:wght@400;700&display=swap" rel="stylesheet" />
        {/* Material Symbols (アイコン) */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}