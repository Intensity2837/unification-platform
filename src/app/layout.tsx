import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '꿈통 시그널: 남북 딜레마 협상',
  description: '중학생을 위한 진로 및 통일 도덕 토론 플랫폼',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
