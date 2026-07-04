'use client';

import { useRouter } from 'next/navigation';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '1rem 2rem', 
        background: 'var(--surface-glass)', 
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--surface-glass-border)'
      }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary)' }}>통일 토론 플랫폼</h2>
        <button 
          onClick={handleLogout}
          style={{
            background: 'transparent',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
            padding: '8px 16px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          로그아웃
        </button>
      </header>
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
