'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']; // 1??~ 5???됱긽

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
      alert('?뱀씤?섏뿀?듬땲??');
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
      alert('諛섎젮?섏뿀?듬땲??');
      router.refresh();
    }
  };

  const handleDeleteTeacher = async (id: string) => {
    const proceed = confirm('?뺣쭚 ??援먯궗 怨꾩젙????젣(?덊눜) 泥섎━?섏떆寃좎뒿?덇퉴?');
    if (!proceed) return;

    const deleteData = confirm(
      '?대떦 援먯궗媛 媛쒖꽕??[?섏뾽]怨?[?숈깮 蹂닿퀬???곗씠?????④퍡 紐⑤몢 ??젣?섏떆寃좎뒿?덇퉴?\n\n' +
      '[?뺤씤]???꾨Ⅴ硫?援먯궗? ?숈깮 ?곗씠?곌? 紐⑤몢 ??젣?섎ŉ, 蹂듦뎄?????놁뒿?덈떎.\n' +
      '[痍⑥냼]瑜??꾨Ⅴ硫??곗씠?곕뒗 蹂댁〈?섍퀬 援먯궗 怨꾩젙留??덊눜(鍮꾪솢?깊솕) 泥섎━?⑸땲??'
    );

    const res = await fetch('/api/admin/delete-teacher', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, keepData: !deleteData }),
    });
    
    if (res.ok) {
      alert(deleteData ? '援먯궗? 愿?⑤맂 紐⑤뱺 ?곗씠?곌? ??젣?섏뿀?듬땲??' : '援먯궗 怨꾩젙???덊눜 泥섎━?섏뿀?쇰ŉ, ?곗씠?곕뒗 蹂댁〈?섏뿀?듬땲??');
      router.refresh();
    } else {
      const data = await res.json();
      alert(data.error || '??젣 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
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
      .map(([score, count]) => ({ name: `${score}??, value: count }));
  };

  const handleDownloadExcel = async () => {
    if (reports.length === 0) {
      alert('?ㅼ슫濡쒕뱶???곗씠?곌? ?놁뒿?덈떎.');
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
              quizzes += qData.map((q: any, i: number) => `Q${i+1}: ${q.question}\nA: ${q.answer}\n?ㅻ챸: ${q.explanation}`).join('\n\n');
            } catch(e) {}
          }
        }
      });

      return {
        '?숈깮 踰덊샇': r.studentNumber,
        '?숈깮 ?대쫫': r.name,
        '?숆탳': r.class?.teacher?.school || '',
        '吏??援먯궗': r.class?.teacher?.name || '',
        '?섏뾽 ?대쫫': r.class?.name || '',
        '吏꾪뻾 ?곹깭': r.status,
        '?ㅻЦ Q1(?곴레??': r.survey?.q1 || '',
        '?ㅻЦ Q2(?댄빐??': r.survey?.q2 || '',
        '?ㅻЦ Q3(怨듦컧??': r.survey?.q3 || '',
        '?ㅻЦ Q4(李몄뿬?섏궗)': r.survey?.q4 || '',
        '?ㅻЦ Q5(醫뗭븯????': r.survey?.q5 || '',
        '?ㅻЦ Q6(?꾩돩????': r.survey?.q6 || '',
        '?댁쫰 ?뺣떟 ??: r.quizScore !== null ? `${r.quizScore}/5` : '',
        'AI 醫낇빀 ?됯? ?먯닔': r.evaluation?.score || '',
        'AI 醫낇빀 ?됯? ?깃툒': r.evaluation?.grade || '',
        'AI 醫낇빀 ?됯? ?붿빟': r.evaluation?.aiSummary || '',
        '異쒖젣???댁쫰 ?댁뿭': quizzes,
        '?꾩껜 ????댁슜': chatLog
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "?숈깮 ?쒕룞 寃곌낵 ?꾩껜");
    XLSX.writeFile(workbook, "?숈깮_?쒕룞_寃곌낵_?꾩껜_蹂닿퀬??xlsx");
  };

  const handleDownloadSurveyExcel = async () => {
    if (reports.length === 0) {
      alert('?ㅼ슫濡쒕뱶???곗씠?곌? ?놁뒿?덈떎.');
      return;
    }
    const XLSX = await import('xlsx');
    
    const surveyData = reports.map(r => ({
      '?숈깮 踰덊샇': r.studentNumber,
      '?숈깮 ?대쫫': r.name,
      '?숆탳': r.class?.teacher?.school || '',
      '吏??援먯궗': r.class?.teacher?.name || '',
      '?섏뾽 ?대쫫': r.class?.name || '',
      'Q1(?곴레??': r.survey?.q1 || '',
      'Q2(?댄빐??': r.survey?.q2 || '',
      'Q3(怨듦컧??': r.survey?.q3 || '',
      'Q4(李몄뿬?섏궗)': r.survey?.q4 || '',
      'Q5(醫뗭븯????': r.survey?.q5 || '',
      'Q6(?꾩돩????': r.survey?.q6 || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(surveyData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "?ㅻЦ ?묐떟 寃곌낵");
    XLSX.writeFile(workbook, "?ㅻЦ_?묐떟_寃곌낵_蹂닿퀬??xlsx");
  };

  const handleAnalyzeSurvey = async () => {
    const validSurveys = reports.filter(r => r.survey && (r.survey.q5 || r.survey.q6));
    if (validSurveys.length === 0) {
      alert('遺꾩꽍??二쇨????묐떟 ?곗씠?곌? ?놁뒿?덈떎.');
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
        alert(data.error || '遺꾩꽍 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
      }
    } catch (e) {
      console.error(e);
      alert('?ㅽ듃?뚰겕 ?ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      <h1 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '2rem' }}>理쒓퀬 愿由ъ옄 ??쒕낫??/h1>
      
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>媛???湲?以묒씤 援먯궗</h2>
        
        {pendingTeachers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>?湲?以묒씤 媛???좎껌???놁뒿?덈떎.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>?대쫫</th>
                <th style={{ padding: '1rem' }}>?숆탳</th>
                <th style={{ padding: '1rem' }}>?대찓??/th>
                <th style={{ padding: '1rem' }}>?좎껌??/th>
                <th style={{ padding: '1rem' }}>愿由?/th>
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
                    <button className="glass-button" style={{ padding: '8px 16px' }} onClick={() => handleApprove(t.id)}>?뱀씤</button>
                    <button className="glass-button" style={{ padding: '8px 16px', background: 'var(--danger)' }} onClick={() => handleReject(t.id)}>諛섎젮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>?뱀씤 ?꾨즺??援먯궗 愿由?/h2>
        
        {approvedTeachers.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>?꾩옱 ?쒕룞 以묒씤 援먯궗媛 ?놁뒿?덈떎.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>?대쫫</th>
                <th style={{ padding: '1rem' }}>?숆탳</th>
                <th style={{ padding: '1rem' }}>?대찓??/th>
                <th style={{ padding: '1rem' }}>媛???뱀씤??/th>
                <th style={{ padding: '1rem' }}>媛쒖꽕???섏뾽 ??/th>
                <th style={{ padding: '1rem' }}>愿由?/th>
              </tr>
            </thead>
            <tbody>
              {approvedTeachers.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{t.name}</td>
                  <td style={{ padding: '1rem' }}>{t.school}</td>
                  <td style={{ padding: '1rem' }}>{t.email}</td>
                  <td style={{ padding: '1rem' }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary)', fontWeight: 'bold' }}>{t._count?.classes || 0}媛?/td>
                  <td style={{ padding: '1rem' }}>
                    <button 
                      className="glass-button" 
                      style={{ padding: '6px 12px', background: 'var(--danger)', fontSize: '0.9rem' }} 
                      onClick={() => handleDeleteTeacher(t.id)}
                    >
                      怨꾩젙 ??젣
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
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>?꾩껜 ?숈깮 蹂닿퀬??諛??ㅻЦ ?듦퀎</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              className="glass-button" 
              style={{ padding: '8px 16px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 'bold' }} 
              onClick={handleDownloadSurveyExcel}
              disabled={isLoadingReports}
            >
              ?뱤 ?ㅻЦ ?묐떟 ?묒? ?ㅼ슫濡쒕뱶
            </button>
            <button 
              className="glass-button" 
              style={{ padding: '8px 16px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 'bold' }} 
              onClick={handleDownloadExcel}
              disabled={isLoadingReports}
            >
              ?뱫 ?꾩껜 ?곗씠???묒? ?ㅼ슫濡쒕뱶
            </button>
          </div>
        </div>
        
        {isLoadingReports ? (
          <p style={{ color: 'var(--text-muted)' }}>?숈깮 ?곗씠?곕? 遺덈윭?ㅻ뒗 以묒엯?덈떎...</p>
        ) : (
          <>
            <div style={{ marginBottom: '3rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>媛앷???臾명빆 ?듦퀎 (?됯퇏 ?먯닔 諛?遺꾪룷)</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {/* Q1 Chart */}
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>?꾨줈洹몃옩 ?곴레??Q1)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{calculateAverage('q1')}??/div>
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
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>遺곹븳 ?댄빐??Q2)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{calculateAverage('q2')}??/div>
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
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>?듭씪 怨듦컧??Q3)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{calculateAverage('q3')}??/div>
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
                  <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>?ν썑 李몄뿬 ?섏궗(Q4)</div>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{calculateAverage('q4')}??/div>
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
                <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>二쇨???臾명빆 AI ?붿빟 遺꾩꽍</h3>
                <button 
                  className="glass-button" 
                  style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', border: 'none', fontWeight: 'bold' }} 
                  onClick={handleAnalyzeSurvey}
                  disabled={isAnalyzing}
                >
                  {isAnalyzing ? '遺꾩꽍 以?..' : '??二쇨????듬? AI 遺꾩꽍?섍린'}
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
              <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>理쒓렐 ?쒕룞 ?숈깮 蹂닿퀬??(?곸쐞 5紐?</h3>
              <button 
                className="glass-button" 
                style={{ padding: '8px 16px', background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)', fontWeight: 'bold' }} 
                onClick={() => router.push('/dashboard/reports')}
              >
                ?꾩껜 蹂닿퀬??蹂닿린 ??              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>?대쫫 (?숇쾲)</th>
                  <th style={{ padding: '1rem' }}>?섏뾽紐?/th>
                  <th style={{ padding: '1rem' }}>吏꾪뻾 ?④퀎</th>
                  <th style={{ padding: '1rem' }}>?댁쫰 ?뺣떟</th>
                  <th style={{ padding: '1rem' }}>蹂닿퀬??/th>
                </tr>
              </thead>
              <tbody>
                {reports.slice(0, 5).map((r: any) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>{r.name} ({r.studentNumber})</td>
                    <td style={{ padding: '1rem' }}>{r.class?.name}</td>
                    <td style={{ padding: '1rem' }}>{r.status}</td>
                    <td style={{ padding: '1rem', color: '#10b981', fontWeight: 'bold' }}>{r.quizScore !== null ? `${r.quizScore}媛? : '-'}</td>
                    <td style={{ padding: '1rem' }}>
                      <button 
                        className="glass-button" 
                        style={{ padding: '6px 12px', fontSize: '0.9rem' }}
                        onClick={() => router.push(`/dashboard/report/${r.id}`)}
                      >
                        ?곸꽭 蹂닿린
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length > 5 && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '1rem', fontSize: '0.9rem' }}>
                * ??留롮? ?숈깮 紐⑸줉? [?꾩껜 蹂닿퀬??蹂닿린] 踰꾪듉???대┃?댁＜?몄슂.
              </p>
            )}
          </>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>媛쒖꽕???섏뾽 紐⑸줉</h2>
        
        {allClasses.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>?꾩쭅 媛쒖꽕???섏뾽???놁뒿?덈떎.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--surface-glass-border)', textAlign: 'left' }}>
                <th style={{ padding: '1rem' }}>?섏뾽紐?/th>
                <th style={{ padding: '1rem' }}>?섏뾽 肄붾뱶</th>
                <th style={{ padding: '1rem' }}>?대떦 援먯궗</th>
                <th style={{ padding: '1rem' }}>李몄뿬 ?숈깮 ??/th>
                <th style={{ padding: '1rem' }}>?앹꽦??/th>
              </tr>
            </thead>
            <tbody>
              {allClasses.map((c: any) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--primary)' }}>{c.code}</td>
                  <td style={{ padding: '1rem' }}>{c.teacher.name} ({c.teacher.school})</td>
                  <td style={{ padding: '1rem' }}>{c._count.studentSessions}紐?/td>
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

