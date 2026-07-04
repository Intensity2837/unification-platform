import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ReportPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = await params;
  const session = await getSession();
  
  if (!session) {
    redirect('/');
  }

  const { sessionId } = resolvedParams;

  const studentSession = await prisma.studentSession.findUnique({
    where: { id: sessionId },
    include: {
      class: {
        include: {
          teacher: { select: { name: true, school: true } }
        }
      },
      survey: true,
      evaluation: true,
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!studentSession) {
    return <div style={{ padding: '2rem' }}>해당 보고서를 찾을 수 없습니다.</div>;
  }

  // Access control
  if (session.role !== 'ADMIN' && studentSession.class.teacherId !== session.userId) {
    return <div style={{ padding: '2rem' }}>이 보고서에 접근할 권한이 없습니다.</div>;
  }

  // Parse Quizzes and Final Report from messages
  const quizzes: any[] = [];
  let finalReportContent = '';

  studentSession.messages.forEach(m => {
    if (m.role === 'MODEL') {
      if (m.content.includes('[QUIZ_DATA]')) {
        const match = m.content.match(/\[QUIZ_DATA\]([\s\S]*?)\[\/QUIZ_DATA\]/);
        if (match) {
          try {
            const parsed = JSON.parse(match[1]);
            if (Array.isArray(parsed)) {
              quizzes.push(...parsed);
            }
          } catch (e) {}
        }
      }

      if (m.content.includes('최종 평가 보고서')) {
        finalReportContent = m.content
          .replace(/\[STAGE:\s*\d+\]/g, '')
          .replace(/\[EMOTION:\s*[A-Z]+\]/gi, '')
          .replace(/\[END_ROLEPLAY\]/g, '')
          .trim();
      }
    }
  });

  let studentQuizResults: any[] = [];
  if (studentSession.quizAnswers) {
    try {
      studentQuizResults = JSON.parse(studentSession.quizAnswers);
    } catch(e) {}
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 'bold' }}>
          ← 대시보드로 돌아가기
        </Link>
      </div>

      <h1 style={{ fontSize: '2.5rem', color: 'var(--primary)', marginBottom: '2rem' }}>
        학생 활동 결과 보고서
      </h1>

      {/* Student Info */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--surface-glass-border)', paddingBottom: '0.5rem' }}>학생 정보</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '1.1rem' }}>
          <div><strong>이름:</strong> {studentSession.name}</div>
          <div><strong>학번:</strong> {studentSession.studentNumber}</div>
          <div><strong>수업명:</strong> {studentSession.class.name}</div>
          <div><strong>담당 교사:</strong> {studentSession.class.teacher.name} ({studentSession.class.teacher.school})</div>
          <div><strong>진행 상태:</strong> {studentSession.status}</div>
          <div><strong>활동 일시:</strong> {new Date(studentSession.updatedAt).toLocaleString()}</div>
        </div>
      </div>

      {/* AI Evaluation */}
      {studentSession.evaluation && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(16, 185, 129, 0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#10b981', borderBottom: '2px solid rgba(16, 185, 129, 0.2)', paddingBottom: '0.5rem' }}>AI 종합 평가</h2>
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '3rem', fontWeight: 'bold', color: '#10b981', marginRight: '1rem' }}>{studentSession.evaluation.grade}</span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>총점: {studentSession.evaluation.score}점</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
            {studentSession.evaluation.aiSummary}
          </div>
        </div>
      )}

      {/* Student Final Report */}
      {finalReportContent && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(59, 130, 246, 0.05)' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#3b82f6', borderBottom: '2px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem' }}>학생 활동 최종 평가 보고서</h2>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)' }}>
            {finalReportContent}
          </div>
        </div>
      )}

      {/* Survey Results */}
      {studentSession.survey && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--surface-glass-border)', paddingBottom: '0.5rem' }}>설문 결과</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div><strong>Q. 프로그램에 적극적으로 참여하였나?</strong> <span style={{ color: 'var(--primary)' }}>{studentSession.survey.q1}점</span></div>
            <div><strong>Q. 북한 사회/문화를 깊게 이해하는데 도움이 되었나?</strong> <span style={{ color: 'var(--primary)' }}>{studentSession.survey.q2}점</span></div>
            <div><strong>Q. 통일의 중요성에 대해 공감하게 되었나?</strong> <span style={{ color: 'var(--primary)' }}>{studentSession.survey.q3}점</span></div>
            <div><strong>Q. 향후 통일 프로그램 참여 의사</strong> <span style={{ color: 'var(--primary)' }}>{studentSession.survey.q4}점</span></div>
            <div style={{ marginTop: '1rem' }}>
              <strong>Q. 가장 인상 깊었던 점:</strong>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>{studentSession.survey.q5}</div>
            </div>
            {studentSession.survey.q6 && (
              <div>
                <strong>Q. 아쉬웠던 점:</strong>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', marginTop: '0.5rem' }}>{studentSession.survey.q6}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Logs */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--surface-glass-border)', paddingBottom: '0.5rem' }}>단계별 대화 내역</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {studentSession.messages.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>대화 기록이 없습니다.</p>
          ) : (
            (() => {
              let currentStage = 1;
              return studentSession.messages.map((m, idx) => {
                const isUser = m.role === 'USER';
                let stageMatch = m.content.match(/\[STAGE:\s*(\d+)\]/);
                let stageLabel = '';
                if (stageMatch) {
                  currentStage = parseInt(stageMatch[1], 10);
                }
                stageLabel = `[${currentStage}단계]`;
                let aiName = currentStage === 3 ? '북한 대표' : '꿈통이';

                let cleanContent = m.content
                  .replace(/\*\*/g, '')
                  .replace(/\[STAGE:\s*\d+\]/g, '')
                  .replace(/\[EMOTION:\s*[A-Z]+\]/gi, '')
                  .replace(/\[HINT_START\][\s\S]*?\[HINT_END\]/g, '') 
                  .replace(/\[HINT_TITLE:[^\]]*\]/g, '')
                  .replace(/\[QUIZ_DATA\][\s\S]*?\[\/QUIZ_DATA\]/g, '[퀴즈가 출제되었습니다]') 
                  .replace(/\[END_ROLEPLAY\]/g, '')
                  .trim();
                
                if (!cleanContent) return null;

                return (
                  <div key={idx} style={{ 
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    background: isUser ? '#e0e7ff' : '#f3f4f6',
                    color: '#1f2937',
                    padding: '1rem 1.5rem',
                    borderRadius: '12px',
                    maxWidth: '85%',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}>
                    <strong style={{ fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#6b7280', marginBottom: '4px' }}>
                      {stageLabel && <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 6px', borderRadius: '4px' }}>{stageLabel}</span>}
                      {isUser ? studentSession.name : aiName}
                    </strong>
                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {cleanContent}
                    </div>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* Quizzes */}
      {(studentQuizResults.length > 0 || quizzes.length > 0) && (
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', borderBottom: '2px solid var(--surface-glass-border)', paddingBottom: '0.5rem' }}>
            퀴즈 결과 {studentSession.quizScore !== null && <span style={{color: '#10b981', marginLeft: '1rem'}}>({studentSession.quizScore} / 5개 정답)</span>}
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {studentQuizResults.length > 0 ? (
              studentQuizResults.map((q, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px', borderLeft: q.isCorrect ? '4px solid #10b981' : '4px solid #ef4444' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Q{idx + 1}. {q.question}</p>
                  <div style={{ color: q.isCorrect ? '#10b981' : '#ef4444', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    {q.isCorrect ? '⭕ 정답' : '❌ 오답'} (학생 답안: {q.studentAnswer})
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>실제 정답: {q.correctAnswer}</div>
                </div>
              ))
            ) : (
              quizzes.map((q, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Q{idx + 1}. {q.question}</p>
                  <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '0.5rem' }}>정답: {q.answer}</div>
                  <div style={{ color: 'var(--text-muted)' }}>해설: {q.explanation}</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}
