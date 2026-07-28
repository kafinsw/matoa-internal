import './globals.css';

export const metadata = {
  title: 'Matoa Internal Backend',
  description: 'Backend Next.js untuk Matoa Internal',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
