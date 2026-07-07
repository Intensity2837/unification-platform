'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']; // 1점 ~ 5점 색상

export default function AdminDashboard({ pendingTeachers, approvedTeachers, allClasses }: { pendingTeachers: any[], approvedTeachers: any[], allClasses: any[] }) {
  const router = useRouter();
  
  const [reports, setReports] = useState<any[]>([]);
  const [isLoadingReports, setIsLoadingReports] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
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

  const handleApprove = async (id: string) => {
    const res = await fetch('/api/admin/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      alert('승인되었습니다.');
      router.refresh();
    }
  };

  const handleReject = async (id: string) => {
    const res = await fetch('/api/admin/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      alert('반려되었습니다.');
      router.refresh();
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const proceed = confirm('정말 이 교사 계정을 삭제(탈퇴) 처리하시겠습니까?');
    if (!proceed) return;

    const deleteData = confirm(
      '해당 교사가 개설한 [수업]과 [학생 보고서 데이터]도 함께 모두 삭제하시겠습니까?\n\n' +
      '[확인]을 누르면 교사와 학생 데이터가 모두 삭제되며, 복구할 수 없습니다.\n' +
      '[취소]를 누르면 데이터는 보존되고 교사 계정만 탈퇴(비활성화) 처리됩니다.'
    );

    const res = await fetch('/api/admin/delete-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, keepData: !deleteData }),
    });
    
    if (res.ok) {
      alert(deleteData ? '교사와 관련된 모든 데이터가 삭제되었습니다.' : '교사 계정이 탈퇴 처리되었으며, 데이터는 보존되었습니다.');
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || '삭제 중 오류가 발생했습니다.');
    }
  };

  const calculateAverage = (key: string) => {
    const validSurveys = reports.filter(r => r.survey && typeof r.survey[key] === 'number');
    if (validSurveys.length === 0) return 0;
    const sum = validSurveys.reduce((acc, r) => acc + r.survey[key], 0);
    return (sum / validSurveys.length).toFixed(2);
  };

  const getChartData = (key: string) => {
    const validSurveys = reports.filter(r => r.survey && typeof r.survey[key] === 'number');
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    validSurveys.forEach(r => {
      const val = r.survey[key] as 1|2|3|4|5;
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .map(([score, count]) => ({ name: `${score}점`, value: count }));
  };

  const handleDownloadExcel = async () => {
    if (reports.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    const XLSX = await import('xlsx');
    
    const dataToExport = reports.map(r => {
      const chatLog = r.messages.map((m: any) => `[${m.role}] ${m.content}`).join('\n\n');
      
      let quizzes = '';
      r.messages.forEach((m: any) => {
        if (m.role === 'MODEL' && m.content.includes('[QUIZ_DATA]')) {
          const match = m.content.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
          if (match) {
            try {
              const qData = JSON.parse(match[1]);
              quizzes += qData.map((q: any, i: number) => `Q${i+1}: ${q.question}\nA: ${q.answer}\n설명: ${q.explanation}`).join('\n\n');
            } catch(e) {}
          }
        }
      });

      return {
        '학생 번호': r.studentNumber,
        '학생 이름': r.name,
        '학교': r.class?.teacher?.school || '',
        '지도 교사': r.class?.teacher?.name || '',
        '수업 이름': r.class?.name || '',
        '진행 상태': r.status,
        '설문 Q1(적극성)': r.survey?.q1 || '',
        '설문 Q2(이해도)': r.survey?.q2 || '',
        '설문 Q3(공감도)': r.survey?.q3 || '',
        '설문 Q4(참여의사)': r.survey?.q4 || '',
        '설문 Q5(좋았던 점)': r.survey?.q5 || '',
        '설문 Q6(아쉬운 점)': r.survey?.q6 || '',
        '퀴즈 정답 수': r.quizScore !== null ? `${r.quizScore}/5` : '',
        'AI 종합 평가 점수': r.evaluation?.score || '',
        'AI 종합 평가 등급': r.evaluation?.grade || '',
        'AI 종합 평가 요약': r.evaluation?.aiSummary || '',
        '출제된 퀴즈 내역': quizzes,
        '전체 대화 내용': chatLog
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "학생 활동 결과 전체");
    XLSX.writeFile(workbook, "학생_활동_결과_전체_보고서.xlsx");
  };

  const handleDownloadSurveyExcel = async () => {
    if (reports.length === 0) {
      alert('다운로드할 데이터가 없습니다.');
      return;
    }
    const XLSX = await import('xlsx');
    
    const surveyData = reports.map(r => ({
      '학생 번호': r.studentNumber,
      '학생 이름': r.name,
      '학교': r.class?.teacher?.school || '',
      '지도 교사': r.class?.teacher?.name || '',
      '수업 이름': r.class?.name || '',
      'Q1(적극성)': r.survey?.q1 || '',
      'Q2(이해도)': r.survey?.q2 || '',
      'Q3(공감도)': r.survey?.q3 || '',
      'Q4(참여의사)': r.survey?.q4 || '',
      'Q5(좋았던 점)': r.survey?.q5 || '',
      'Q6(아쉬운 점)': r.survey?.q6 || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(surveyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "설문 응답 결과");
    XLSX.writeFile(workbook, "설문_응답_결과_보고서.xlsx");
  };

  const handleAnalyzeSurvey = async () => {
    const validSurveys = reports.filter(r => r.survey && (r.survey.q5 || r.survey.q6));
    if (validSurveys.length === 0) {
      alert('분석할 주관식 응답 데이터가 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    setAiSummary('');

    try {
      const feedbackData = validSurveys.map(r => ({
        q5: r.survey.q5,
        q6: r.survey.q6
      }));

      const res = await fetch('/api/admin/analyze-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackData })
      });
      const data = await res.json();

      if (data.summary) {
        setAiSummary(data.summary);
      } else {
        alert(data.error || '분석 중 오류가 발생했습니다.');
      }
    } catch (e) {
      console.error(e);
      alert('네트워크 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>최고 관리자 대시보드</h1>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>가입 대기 중인 교사</h2>
        
        {pendingTeachers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>대기 중인 가입 신청이 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>이름</th>
                <th style={{ padding: '1rem' }}>학교</th>
                <th style={{ padding: '1rem' }}>이메일</th>
                <th style={{ padding: '1rem' }}>신청일</th>
                <th style={{ padding: '1rem' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {pendingTeachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <td style={{ padding: '1rem' }}>{t.name}</td>
                  <td style={{ padding: '1rem' }}>{t.school}</td>
                  <td style={{ padding: '1rem' }}>{t.email}</td>
                  <td style={{ padding: '1rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="glass-button" style={{ padding: '8px 16px' }} onClick={() => handleApprove(t.id)}>승인</button>
                    <button className="glass-button" style={{ padding: '8px 16px', background: 'var(--danger)' }} onClick={() => handleReject(t.id)}>반려</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>승인 완료된 교사 관리</h2>
        
        {approvedTeachers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>현재 활동 중인 교사가 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>이름</th>
                <th style={{ padding: '1rem' }}>학교</th>
                <th style={{ padding: '1rem' }}>이메일</th>
                <th style={{ padding: '1rem' }}>가입 승인일</th>
                <th style={{ padding: '1rem' }}>개설한 수업 수</th>
                <th style={{ padding: '1rem' }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {approvedTeachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{t.name}</td>
                  <td style={{ padding: '1rem' }}>{t.school}</td>
                  <td style={{ padding: '1rem' }}>{t.email}</td>
                  <td style={{ padding: '1rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{t._count?.classes || 0}개</td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      className="glass-button" 
                      style={{ padding: '6px 12px', background: 'var(--danger)', fontSize: '0.9rem' }} 
                      onClick={() => handleDeleteTeacher(t.id)}
                    >
                      계정 삭제
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>전체 학생 보고서 및 설문 통계</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="glass-button" 
              style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold' }} 
              onClick={handleDownloadSurveyExcel}
              disabled={isLoadingReports}
            >
              📊 설문 응답 엑셀 다운로드
            </button>
            <button 
              className="glass-button" 
              style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold' }} 
              onClick={handleDownloadExcel}
              disabled={isLoadingReports}
            >
              📑 전체 데이터 엑셀 다운로드
            </button>
          </div>
        </div>
        
        {isLoadingReports ? (
          <p style={{ color: 'var(--text-muted)' }}>학생 데이터를 불러오는 중입니다...</p>
        ) : (
          <>
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>객관식 문항 통계 (평균 점수 및 분포)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* Q1 Chart */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>프로그램 적극성(Q1)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{calculateAverage('q1')}점</div>
                  <div style={{ height: '200px', marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getChartData('q1')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                          {getChartData('q1').map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[parseInt(entry.name) - 1] || '#ccc'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Q2 Chart */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>북한 이해도(Q2)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{calculateAverage('q2')}점</div>
                  <div style={{ height: '200px', marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getChartData('q2')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                          {getChartData('q2').map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[parseInt(entry.name) - 1] || '#ccc'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Q3 Chart */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>통일 공감도(Q3)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{calculateAverage('q3')}점</div>
                  <div style={{ height: '200px', marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getChartData('q3')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                          {getChartData('q3').map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[parseInt(entry.name) - 1] || '#ccc'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Q4 Chart */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>향후 참여 의사(Q4)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{calculateAverage('q4')}점</div>
                  <div style={{ height: '200px', marginTop: '1rem' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={getChartData('q4')} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label>
                          {getChartData('q4').map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[parseInt(entry.name) - 1] || '#ccc'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '3rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>주관식 문항 AI 요약 분석</h3>
                <button 
                  className="glass-button" 
                  style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontWeight: 'bold' }} 
                  onClick={handleAnalyzeSurvey}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? '분석 중...' : '✨ 주관식 답변 AI 분석하기'}
                </button>
              </div>

              {aiSummary && (
                <div style={{ 
                  background: 'rgba(139, 92, 246, 0.1)', 
                  padding: '2rem', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  lineHeight: 1.6,
                  color: 'var(--text-main)'
                }}>
                  <div className="markdown-body">
                    <ReactMarkdown>{aiSummary}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>최근 활동 학생 보고서 (상위 5명)</h3>
              <button 
                className="glass-button" 
                style={{ padding: '8px 16px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: 'bold' }} 
                onClick={() => router.push('/dashboard/reports')}
              >
                전체 보고서 보기 ➔
              </button>
            </div>
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

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>개설된 수업 목록</h2>
        
        {allClasses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>아직 개설된 수업이 없습니다.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>수업명</th>
                <th style={{ padding: '1rem' }}>수업 코드</th>
                <th style={{ padding: '1rem' }}>담당 교사</th>
                <th style={{ padding: '1rem' }}>참여 학생 수</th>
                <th style={{ padding: '1rem' }}>생성일</th>
              </tr>
            </thead>
            <tbody>
              {allClasses.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary)' }}>{c.code}</td>
                  <td style={{ padding: '1rem' }}>{c.teacher.name} ({c.teacher.school})</td>
                  <td style={{ padding: '1rem' }}>{c._count.studentSessions}명</td>
                  <td style={{ padding: '1rem' }}>{new Date(c.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
