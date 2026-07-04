'use client';

import { useState, useEffect } from 'react';

export default function MonitorClient({ classId }: { classId: string }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [topN, setTopN] = useState<number>(3);
  const [showTopModal, setShowTopModal] = useState(false);

  const extractTopStudents = () => {
    const scoredSessions = sessions.filter(s => s.evaluation?.score !== undefined && s.evaluation?.score !== null);
    scoredSessions.sort((a, b) => b.evaluation.score - a.evaluation.score);
    if (scoredSessions.length === 0) return [];
    
    const maxIndex = Math.min(topN, scoredSessions.length) - 1;
    const cutoffScore = scoredSessions[maxIndex].evaluation.score;

    return scoredSessions.filter(s => s.evaluation.score >= cutoffScore);
  };

  useEffect(() => {
    // Fetch every 3 seconds
    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/class/${classId}/monitor`);
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 3000);
    return () => clearInterval(interval);
  }, [classId]);

  if (sessions.length === 0) {
    return (
      <div className="glass-panel" style={{ padding: '2rem', height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>접속한 학생이 아직 없습니다. 수업 코드를 학생들에게 공유해주세요.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>상위 추출:</span>
        <input 
          type="number" 
          min="1" 
          value={topN} 
          onChange={(e) => setTopN(Math.max(1, parseInt(e.target.value) || 1))} 
          style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--surface-glass-border)', background: 'var(--surface-glass)', color: 'var(--text-main)' }}
        />
        <span style={{ color: 'var(--text-muted)', marginRight: '0.5rem' }}>명</span>
        <button 
          onClick={() => setShowTopModal(true)}
          style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🏆 추출하기
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {sessions.map(s => (
          <div key={s.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: '400px' }}>
            <div style={{ borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.3rem' }}>{s.name} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>({s.studentNumber})</span></h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', background: 'var(--primary)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                    {s.status}
                  </span>
                  {s.evaluation?.score !== undefined && (
                    <span style={{ fontSize: '0.8rem', background: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
                      {s.evaluation.grade} ({s.evaluation.score}점)
                    </span>
                  )}
                </div>
              </div>
            <a href={`/dashboard/report/${s.id}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', padding: '4px 8px', background: '#10b981', color: '#fff', borderRadius: '4px', textDecoration: 'none' }}>
              결과 보고서
            </a>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.9rem' }}>
            {s.messages.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>대화 기록이 없습니다.</p>
            ) : (
              s.messages.map((m: any, idx: number) => (
                <div key={idx} style={{ 
                  alignSelf: m.role === 'USER' ? 'flex-end' : 'flex-start',
                  background: m.role === 'USER' ? '#e0e7ff' : '#f3f4f6',
                  color: 'var(--text-main)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  maxWidth: '90%'
                }}>
                  <strong style={{ fontSize: '0.7rem', display: 'block', color: 'var(--text-muted)', marginBottom: '2px' }}>
                    {m.role === 'USER' ? '학생' : 'AI'}
                  </strong>
                  {m.content}
                </div>
              ))
            )}
          </div>
        </div>
      ))}
      </div>

      {showTopModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            background: 'var(--background)', width: '90%', maxWidth: '600px',
            padding: '2rem', borderRadius: '16px', maxHeight: '80vh', display: 'flex', flexDirection: 'column'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary)', textAlign: 'center' }}>
              🏆 상위 {topN}명 학생 명단
            </h2>
            <div style={{ overflowY: 'auto', flex: 1, marginBottom: '1.5rem' }}>
              {extractTopStudents().length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>평가를 완료한 학생이 없습니다.</p>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.8rem' }}>순위</th>
                      <th style={{ padding: '0.8rem' }}>이름 (학번)</th>
                      <th style={{ padding: '0.8rem', textAlign: 'center' }}>점수</th>
                      <th style={{ padding: '0.8rem', textAlign: 'center' }}>등급</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractTopStudents().map((s, idx, arr) => {
                      // Calculate rank considering ties
                      const rank = arr.findIndex(st => st.evaluation.score === s.evaluation.score) + 1;
                      return (
                        <tr key={s.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                          <td style={{ padding: '0.8rem', fontWeight: 'bold', color: rank <= 3 ? '#fbbf24' : 'var(--text-main)' }}>{rank}위</td>
                          <td style={{ padding: '0.8rem' }}>{s.name} ({s.studentNumber})</td>
                          <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: '#10b981' }}>{s.evaluation.score}점</td>
                          <td style={{ padding: '0.8rem', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}>{s.evaluation.grade}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <button 
              onClick={() => setShowTopModal(false)}
              style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  );
}
