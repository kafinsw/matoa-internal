import './globals.css';

export const metadata = {
  title: 'MatoaGroup Dashboard',
  description: 'Backend Next.js untuk Matoa Internal',
  icons: { icon: '/internal/logo.png' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
