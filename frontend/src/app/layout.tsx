import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import localFont from 'next/font/local';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bullet Time Online',
  description:
    'Reconstructed bullet time scenes from the Matrix with reverse engineered camera data and gaussian splats.',
  icons: [
    {
      rel: 'icon',
      type: 'image/apng',
      url: '/blu-ray-animated.png',
    },
  ],
};

const ledDotMatrix = localFont({
  src: './fonts/Square-Dot-Matrix.ttf',
  display: 'swap',
  variable: '--font-led',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${inter.className} ${ledDotMatrix.variable}`}>
        {children}
      </body>
    </html>
  );
}
