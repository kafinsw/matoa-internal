import './globals.css';

export const metadata = {
  title: 'MatoaGroup Dashboard',
  description: 'Backend Next.js untuk Matoa Internal',
  icons: { icon: 'https://matoagroup.com/wp-content/uploads/2025/03/cropped-logofavicon-32x32.jpg' },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
