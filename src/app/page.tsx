'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [role, setRole] = useState<'student' | 'teacher'>('student');

  // Student Form
  const [classCode, setClassCode] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('girl');

  // Teacher Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('studentName', name);
    localStorage.setItem('studentNumber', studentNumber);
    // Redirect to chat
    router.push(`/chat?code=${classCode}&number=${studentNumber}&name=${name}&gender=${gender}`);
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Login logic
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      router.push('/dashboard');
    } else {
      const data = await res.json();
      alert(data.error);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '480px' }}>
        <h1 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
          꿈통 시그널: 남북 딜레마 협상
        </h1>
        <p style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-muted)' }}>
          우리가 만들어가는 새로운 한반도의 미래
        </p>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button
            className="glass-button"
            style={{ flex: 1, background: role === 'student' ? 'var(--primary)' : 'rgba(255,255,255,0.5)', color: role === 'student' ? '#fff' : 'var(--text-main)' }}
            onClick={() => setRole('student')}
          >
            학생 입장
          </button>
          <button
            className="glass-button"
            style={{ flex: 1, background: role === 'teacher' ? 'var(--primary)' : 'rgba(255,255,255,0.5)', color: role === 'teacher' ? '#fff' : 'var(--text-main)' }}
            onClick={() => setRole('teacher')}
          >
            교사/관리자
          </button>
        </div>

        {role === 'student' ? (
          <form onSubmit={handleStudentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input className="glass-input" placeholder="수업 코드 (6자리)" required value={classCode} onChange={(e) => setClassCode(e.target.value)} />
            <input className="glass-input" placeholder="학번" required value={studentNumber} onChange={(e) => setStudentNumber(e.target.value)} />
            <input className="glass-input" placeholder="이름" required value={name} onChange={(e) => setName(e.target.value)} />
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="gender" value="girl" checked={gender === 'girl'} onChange={(e) => setGender(e.target.value)} />
                여학생 👩‍🎓
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="radio" name="gender" value="boy" checked={gender === 'boy'} onChange={(e) => setGender(e.target.value)} />
                남학생 👨‍🎓
              </label>
            </div>
            <button className="glass-button" type="submit" style={{ marginTop: '1rem' }}>토론 시작하기 🚀</button>
          </form>
        ) : (
          <form onSubmit={handleTeacherSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input className="glass-input" type="text" placeholder="이메일 또는 아이디" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="glass-input" type="password" placeholder="비밀번호" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="glass-button" type="submit" style={{ marginTop: '1rem' }}>로그인</button>
            <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '1rem', color: 'var(--text-muted)' }}>
              계정이 없으신가요? <a href="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>회원가입</a>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
