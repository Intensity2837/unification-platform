'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [school, setSchool] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, school }),
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      router.push('/');
    } else {
      alert(data.error);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '480px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
          교사 회원가입
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          가입 후 최고 관리자의 승인이 필요합니다
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <input className="glass-input" type="email" placeholder="이메일" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <input className="glass-input" type="password" placeholder="비밀번호" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <input className="glass-input" type="text" placeholder="성함" required value={name} onChange={(e) => setName(e.target.value)} />
          <input className="glass-input" type="text" placeholder="학교명" required value={school} onChange={(e) => setSchool(e.target.value)} />
          
          <button className="glass-button" type="submit" style={{ marginTop: '1rem' }}>가입 신청하기</button>
          
          <button 
            type="button" 
            onClick={() => router.push('/')}
            style={{ 
              marginTop: '0.5rem', 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-muted)', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            뒤로 가기
          </button>
        </form>
      </div>
    </div>
  );
}
