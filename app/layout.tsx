import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pyraminx 3D | Interactive 3D Puzzle',
  description: 'A premium, realistic, interactive 3D Pyraminx puzzle built with Three.js, React Three Fiber, and Tailwind CSS.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0d13] text-white antialiased overflow-hidden select-none">
        {children}
      </body>
    </html>
  );
}
