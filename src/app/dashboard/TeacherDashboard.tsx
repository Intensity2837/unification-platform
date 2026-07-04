'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TeacherDashboard({ classes }: { classes: any[] }) {
  const router = useRouter();
  const [className, setClassName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);

  // Fetch initial API key on mount
  useEffect(() => {
    fetch('/api/teacher/settings')
      .then(res => res.json())
      .then(data => {
        if (data.apiKey) setApiKey(data.apiKey);
      })
      .catch(console.error);

    // Fetch reports
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setReports(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingReports(false));
  }, []);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: className }),
      });
      if (res.ok) {
        setClassName('');
        alert('수업이 성공적으로 생성되었습니다!');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveApiKey = async () => {
    setIsSavingKey(true);
    try {
      const res = await fetch('/api/teacher/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      if (res.ok) {
        alert('API 키가 성공적으로 저장되었습니다.');
      } else {
        alert('API 키 저장에 실패했습니다.');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setIsSavingKey(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>교사 대시보드</h1>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>내 설정 (Gemini API 키)</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="glass-input" 
            placeholder="AIzaSy... (구글 AI 스튜디오에서 발급받은 키)" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={{ flex: 1 }}
          />
          <button className="glass-button" onClick={handleSaveApiKey} disabled={isSavingKey}>
            {isSavingKey ? '저장 중...' : '키 저장하기'}
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
          * 저장된 키는 암호화되어 학생들의 수업 대화 시에만 사용됩니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Class Creation Form */}
        <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>새로운 수업 생성</h2>
          <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input 
              className="glass-input" 
              placeholder="수업명 (예: 3학년 1반 도덕)" 
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              required
            />
            <button className="glass-button" type="submit" disabled={isSubmitting}>
              {isSubmitting ? '생성 중...' : '수업 생성 및 코드 발급'}
            </button>
          </form>
        </div>

        {/* Classes List */}
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>내 수업 목록</h2>
          {classes.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>아직 생성된 수업이 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {classes.map(c => (
                <div key={c.id} style={{ 
                  padding: '1.5rem', 
                  background: 'rgba(255,255,255,0.4)', 
                  borderRadius: '8px',
                  border: '1px solid var(--surface-glass-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{c.name}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      입장 코드: <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '1.1rem', background: '#e0e7ff', padding: '2px 6px', borderRadius: '4px' }}>{c.code}</span>
                    </p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
                      참여 학생 수: {c._count.studentSessions}명
                    </p>
                  </div>
                  <button 
                    className="glass-button" 
                    style={{ padding: '10px 20px', fontSize: '0.9rem' }}
                    onClick={() => router.push(`/dashboard/class/${c.id}`)}
                  >
                    학생 모니터링 →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', margin: 0 }}>최근 활동 학생 보고서 (상위 5명)</h2>
          <button 
            className="glass-button" 
            style={{ padding: '8px 16px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: 'bold' }} 
            onClick={() => router.push('/dashboard/reports')}
          >
            전체 보고서 보기 ➔
          </button>
        </div>
        
        {isLoadingReports ? (
          <p style={{ color: 'var(--text-muted)' }}>학생 데이터를 불러오는 중입니다...</p>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>이름 (학번)</th>
                  <th style={{ padding: '1rem' }}>수업명</th>
                  <th style={{ padding: '1rem' }}>진행 단계</th>
                  <th style={{ padding: '1rem' }}>퀴즈 정답</th>
                  <th style={{ padding: '1rem' }}>보고서</th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.name} ({r.studentNumber})</td>
                    <td style={{ padding: '1rem' }}>{r.class?.name}</td>
                    <td style={{ padding: '1rem' }}>{r.status}</td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>{r.quizScore !== null ? `${r.quizScore}개` : '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        className="glass-button" 
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        onClick={() => router.push(`/dashboard/report/${r.id}`)}
                      >
                        상세 보기
                      </button>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      아직 제출된 보고서가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {reports.length > 5 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9rem' }}>
                * 더 많은 학생 목록은 [전체 보고서 보기] 버튼을 클릭해주세요.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
