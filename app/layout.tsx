
import type { Metadata } from "next";
import { Geist, Geist_Mono, Pacifico } from "next/font/google";
import "./globals.css";

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-pacifico',
})

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PuntoEnvío - Envíos Rápidos y Seguros",
  description: "Red nacional de envíos con 30.000 agencias en toda Argentina",
  icons: {
    icon: 'https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/07e6a90271d224bd4e03cad6c2a2b83e.png',
    shortcut: 'https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/07e6a90271d224bd4e03cad6c2a2b83e.png',
    apple: 'https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/07e6a90271d224bd4e03cad6c2a2b83e.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning={true}>
      <head>
        <link href="https://cdn.jsdelivr.net/npm/remixicon@3.5.0/fonts/remixicon.css" rel="stylesheet" />
        <link rel="icon" type="image/png" sizes="32x32" href="https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/07e6a90271d224bd4e03cad6c2a2b83e.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/07e6a90271d224bd4e03cad6c2a2b83e.png" />
        <link rel="apple-touch-icon" href="https://static.readdy.ai/image/61e0f65af7c1d2cfd20d225daa38278c/07e6a90271d224bd4e03cad6c2a2b83e.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${pacifico.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
