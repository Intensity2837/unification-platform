'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AllReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Sorting & Filtering State
  const [sortField, setSortField] = useState<'createdAt' | 'name' | 'className' | 'status' | 'quizScore' | 'score' | 'grade'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [classFilter, setClassFilter] = useState<string>('ALL');
  
  useEffect(() => {
    fetch('/api/reports')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setReports(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} 학생의 전체 데이터(대화 기록, 퀴즈, 설문 등)를 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 통계에서도 즉시 제외됩니다.`)) {
      return;
    }
    
    try {
      const res = await fetch(`/api/report/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('성공적으로 삭제되었습니다.');
        setReports(prev => prev.filter(r => r.id !== id));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('오류가 발생했습니다.');
    }
  };

  const handleSort = (field: 'createdAt' | 'name' | 'className' | 'status' | 'quizScore' | 'score' | 'grade') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'name' || field === 'grade' || field === 'className' || field === 'status' ? 'asc' : 'desc');
    }
  };

  const uniqueClasses = Array.from(new Set(reports.map(r => r.class?.name).filter(Boolean)));

  const filteredReports = reports.filter(r => {
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'COMPLETED' && r.status !== 'COMPLETED') return false;
      if (statusFilter === 'IN_PROGRESS' && r.status === 'COMPLETED') return false;
    }
    if (classFilter !== 'ALL' && r.class?.name !== classFilter) return false;
    return true;
  });

  const sortedReports = [...filteredReports].sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];
    
    if (sortField === 'quizScore') {
      valA = a.quizScore ?? -1;
      valB = b.quizScore ?? -1;
    } else if (sortField === 'score') {
      valA = a.evaluation?.score ?? -1;
      valB = b.evaluation?.score ?? -1;
    } else if (sortField === 'grade') {
      valA = a.evaluation?.grade ?? 'Z';
      valB = b.evaluation?.grade ?? 'Z';
    } else if (sortField === 'className') {
      valA = a.class?.name ?? '';
      valB = b.class?.name ?? '';
    } else if (sortField === 'status') {
      valA = a.status ?? '';
      valB = b.status ?? '';
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (isLoading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>로딩 중...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          className="glass-button" 
          style={{ padding: '8px 16px', background: 'var(--surface-glass)', color: 'var(--text-main)', border: '1px solid var(--surface-glass-border)' }}
          onClick={() => router.back()}
        >
          ← 돌아가기
        </button>
        <h1 style={{ fontSize: '2rem', color: 'var(--primary)', margin: 0 }}>전체 학생 보고서</h1>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        
        {/* Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--text-muted)' }}>수업명 필터:</span>
            <select 
              className="glass-input" 
              style={{ width: 'auto', padding: '8px 16px' }}
              value={classFilter} 
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="ALL">전체 수업</option>
              {uniqueClasses.map((className: any) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>

            <span style={{ color: 'var(--text-muted)', marginLeft: '1rem' }}>진행 상태 필터:</span>
            <select 
              className="glass-input" 
              style={{ width: 'auto', padding: '8px 16px' }}
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">전체 보기</option>
              <option value="COMPLETED">완료 (COMPLETED)</option>
              <option value="IN_PROGRESS">진행 중</option>
            </select>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            총 {sortedReports.length}명의 데이터
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('name')}
                >
                  이름 (학번) {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('className')}
                >
                  수업명 {sortField === 'className' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('status')}
                >
                  진행 단계 {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('quizScore')}
                >
                  퀴즈 정답 {sortField === 'quizScore' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('score')}
                >
                  점수 {sortField === 'score' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('grade')}
                >
                  등급 {sortField === 'grade' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  style={{ padding: '1rem', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('createdAt')}
                >
                  참여 일시 {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th style={{ padding: '1rem', textAlign: 'center' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {sortedReports.map((r: any) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.name} ({r.studentNumber})</td>
                  <td style={{ padding: '1rem' }}>{r.class?.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold',
                      background: r.status === 'COMPLETED' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                      color: r.status === 'COMPLETED' ? '#10b981' : '#3b82f6'
                    }}>
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>
                    {r.quizScore !== null ? `${r.quizScore}개` : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {r.evaluation?.score !== undefined ? `${r.evaluation.score}점` : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                    {r.evaluation?.grade ? r.evaluation.grade : '-'}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button 
                      className="glass-button" 
                      style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                      onClick={() => router.push(`/dashboard/report/${r.id}`)}
                    >
                      상세 보기
                    </button>
                    <button 
                      className="glass-button" 
                      style={{ padding: '6px 12px', fontSize: '0.9rem', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                      onClick={() => handleDelete(r.id, r.name)}
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))}
              {sortedReports.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    해당하는 보고서가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

